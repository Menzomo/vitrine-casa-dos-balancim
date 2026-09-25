import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidMlToken } from '@/lib/ml/token'

// Categorias do ML que são de fato balancim de válvula (autopeças). O
// vendedor também tem produtos fora desse escopo (bola de engate, união
// sanitária) que ficam de fora por enquanto — ver relatório de "ignorados"
// no fim da carga.
const ALLOWED_CATEGORY_IDS = new Set(['MLB194177', 'MLB193389', 'MLB237416'])

// Normaliza a marca extraída do catálogo do ML pro nome que o site usa.
// "Chevrolet" -> "GM" (GM é a marca já usada no site); variações de
// grafia (ex: "Mercedes-benz") viram a forma canônica.
const BRAND_ALIASES: Record<string, string> = {
  chevrolet: 'GM',
  'mercedes-benz': 'Mercedes-Benz',
}

function normalizeBrand(raw: string | null): string | null {
  if (!raw) return null
  return BRAND_ALIASES[raw.toLowerCase()] ?? raw
}

const ML_API = 'https://api.mercadolibre.com'
const UA = { 'User-Agent': 'CasaDosBalancim-Integracao/1.0' }

type MlItem = {
  id: string
  title: string
  price: number
  available_quantity: number
  status: string
  category_id: string
  permalink: string
  last_updated: string
  pictures?: { url: string; secure_url?: string }[]
  attributes?: unknown
}

type MlBulkResult = { id: string; status_code: number; body: MlItem }

type MlCompatibility = {
  products?: { catalog_product_name: string }[]
}

// Carga inicial (etapa 4): busca todos os anúncios do vendedor, filtra só
// as categorias de balancim, e faz upsert em products. Uso manual/único —
// não roda sozinho, o Bruno acessa essa URL quando quiser (re)popular.
export async function GET() {
  const supabase = createAdminClient()

  const { data: cred, error: credError } = await supabase
    .from('ml_credentials')
    .select('seller_id')
    .single()

  if (credError || !cred) {
    return report('Nenhuma credencial do Mercado Livre encontrada. Rode /api/ml/connect primeiro.', null)
  }

  const accessToken = await getValidMlToken()
  const auth = { Authorization: `Bearer ${accessToken}`, ...UA }

  // 1. Paginar todos os IDs de anúncio do vendedor.
  const itemIds: string[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const searchRes = await fetch(
      `${ML_API}/users/${cred.seller_id}/items/search?limit=${limit}&offset=${offset}`,
      { headers: auth }
    )
    if (!searchRes.ok) {
      return report(`Falha ao listar anúncios (status ${searchRes.status}): ${await searchRes.text()}`, null)
    }
    const search = (await searchRes.json()) as { results: string[]; paging: { total: number } }
    itemIds.push(...search.results)
    offset += limit
    if (offset >= search.paging.total || search.results.length === 0) break
  }

  // 2. Buscar detalhes em lotes de 20 via /items/bulk (substituto do
  // /items?ids= antigo, que está em descontinuação).
  const items: MlItem[] = []
  for (let i = 0; i < itemIds.length; i += 20) {
    const chunk = itemIds.slice(i, i + 20)
    const bulkRes = await fetch(`${ML_API}/items/bulk?ids=${chunk.join(',')}`, { headers: auth })
    if (!bulkRes.ok) {
      await logSync(supabase, chunk.map((id) => ({ ml_item_id: id, result: 'error', error: `bulk fetch falhou: ${bulkRes.status}` })))
      continue
    }
    const bulk = (await bulkRes.json()) as MlBulkResult[]
    for (const entry of bulk) {
      if (entry.status_code === 200) {
        items.push(entry.body)
      } else {
        await logSync(supabase, [{ ml_item_id: entry.id, result: 'error', error: `status_code ${entry.status_code}` }])
      }
    }
  }

  // 3. Separar o que está dentro do escopo (categorias de balancim) do que não está.
  const included = items.filter((item) => ALLOWED_CATEGORY_IDS.has(item.category_id))
  const skipped = items.filter((item) => !ALLOWED_CATEGORY_IDS.has(item.category_id))

  await logSync(
    supabase,
    skipped.map((item) => ({
      ml_item_id: item.id,
      result: 'skipped',
      error: `categoria ${item.category_id} fora do escopo (não é balancim)`,
    }))
  )

  // 4. Pra cada item incluído, buscar compatibilidades (marca/modelo do
  // veículo) e montar a linha de products.
  const rows = []
  const syncEntries = []
  for (const item of included) {
    let brandGuess: string | null = null
    let compatibilities: MlCompatibility['products'] = []
    try {
      const compatRes = await fetch(`${ML_API}/items/${item.id}/compatibilities`, { headers: auth })
      if (compatRes.ok) {
        const compat = (await compatRes.json()) as MlCompatibility
        compatibilities = compat.products ?? []
        const firstName = compatibilities[0]?.catalog_product_name
        brandGuess = normalizeBrand(firstName ? firstName.split(' ')[0] : null)
      }
    } catch {
      // sem compatibilidade cadastrada ou falha pontual — segue sem marca
    }

    rows.push({
      ml_item_id: item.id,
      title: item.title,
      price: item.price,
      stock: item.available_quantity,
      status: item.status,
      images: (item.pictures ?? []).map((p) => p.secure_url ?? p.url),
      permalink: item.permalink,
      brand: brandGuess,
      ml_attributes: { category_id: item.category_id, attributes: item.attributes ?? null, compatibilities },
      ml_updated_at: item.last_updated,
      synced_at: new Date().toISOString(),
    })
    syncEntries.push({ ml_item_id: item.id, result: 'success' as const, error: null })
  }

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from('products').upsert(rows, { onConflict: 'ml_item_id' })
    if (upsertError) {
      return report(`Falha ao salvar produtos: ${upsertError.message}`, null)
    }
  }
  await logSync(supabase, syncEntries)

  // 5. Relatório: produtos ativos por marca (só o que foi importado agora).
  const activeByBrand = new Map<string, number>()
  for (const row of rows) {
    if (row.status !== 'active') continue
    const key = row.brand ?? '(sem marca identificada)'
    activeByBrand.set(key, (activeByBrand.get(key) ?? 0) + 1)
  }

  return report(null, {
    totalNaConta: itemIds.length,
    importados: rows.length,
    ignorados: skipped.map((s) => ({ id: s.id, title: s.title, category_id: s.category_id })),
    ativosPorMarca: Object.fromEntries([...activeByBrand.entries()].sort((a, b) => b[1] - a[1])),
  })
}

async function logSync(
  supabase: ReturnType<typeof createAdminClient>,
  entries: { ml_item_id: string; result: 'success' | 'error' | 'skipped'; error: string | null }[]
) {
  if (entries.length === 0) return
  await supabase.from('sync_log').insert(entries.map((e) => ({ ...e, source: 'initial' as const })))
}

function report(error: string | null, data: unknown) {
  const body = error ? { error } : { ok: true, ...(data as object) }
  return NextResponse.json(body, { status: error ? 500 : 200 })
}
