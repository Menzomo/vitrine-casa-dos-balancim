import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export const ML_API = 'https://api.mercadolibre.com'
export const UA = { 'User-Agent': 'CasaDosBalancim-Integracao/1.0' }

// Categorias do ML que são de fato balancim de válvula (autopeças).
export const BALANCIM_CATEGORY_IDS = new Set(['MLB194177', 'MLB193389', 'MLB237416'])

// Outros produtos que o vendedor também anuncia (bola de engate, união
// sanitária) — fora da especialidade de balancim, mas entram como
// "Acessórios" porque o cliente pediu destaque (são os que mais vendem).
export const ACCESSORY_CATEGORY_IDS = new Set(['MLB430567', 'MLB3530'])

export const ALLOWED_CATEGORY_IDS = new Set([...BALANCIM_CATEGORY_IDS, ...ACCESSORY_CATEGORY_IDS])

// Normaliza a marca extraída do catálogo do ML pro nome que o site usa.
const BRAND_ALIASES: Record<string, string> = {
  chevrolet: 'GM',
  'mercedes-benz': 'Mercedes-Benz',
}

export function normalizeBrand(raw: string | null): string | null {
  if (!raw) return null
  return BRAND_ALIASES[raw.toLowerCase()] ?? raw
}

export type MlItem = {
  id: string
  title: string
  price: number
  available_quantity: number
  status: string
  category_id: string
  permalink: string
  sold_quantity: number
  last_updated: string
  seller_id: number
  pictures?: { url: string; secure_url?: string }[]
  attributes?: unknown
}

export type MlBulkResult = { id: string; status_code: number; body: MlItem }
export type MlCompatibility = { products?: { catalog_product_name: string }[] }
export type MlDescription = { text?: string; plain_text?: string }

export type ProductCategory = 'roletado' | 'admissao' | 'escape' | 'conjunto' | 'acessorios'

// Categoria (roletado/admissao/escape/conjunto) não existe no ML — é
// taxonomia nossa. Deriva por palavra-chave no título, no mesmo padrão
// usado nos 24 produtos fictícios originais: "roletado" é a linha geral
// (padrão quando o título não especifica admissão/escape/conjunto).
export function guessCategory(item: MlItem): ProductCategory {
  if (ACCESSORY_CATEGORY_IDS.has(item.category_id)) return 'acessorios'
  const t = item.title.toLowerCase()
  const hasAdmissao = t.includes('admiss')
  const hasEscape = t.includes('escape')
  if (t.includes('conjunto') || t.includes('eixo')) return 'conjunto'
  if (hasAdmissao && hasEscape) return 'conjunto'
  if (hasAdmissao) return 'admissao'
  if (hasEscape) return 'escape'
  return 'roletado'
}

export async function fetchItem(auth: HeadersInit, itemId: string): Promise<MlItem | null> {
  const res = await fetch(`${ML_API}/items/${itemId}`, { headers: auth })
  if (!res.ok) return null
  return (await res.json()) as MlItem
}

// Busca em lotes de 20 via /items/bulk (substituto do /items?ids= antigo,
// que está em descontinuação pelo ML).
export async function fetchItemsBulk(
  auth: HeadersInit,
  itemIds: string[]
): Promise<{ items: MlItem[]; failedIds: string[] }> {
  const items: MlItem[] = []
  const failedIds: string[] = []
  for (let i = 0; i < itemIds.length; i += 20) {
    const chunk = itemIds.slice(i, i + 20)
    const res = await fetch(`${ML_API}/items/bulk?ids=${chunk.join(',')}`, { headers: auth })
    if (!res.ok) {
      failedIds.push(...chunk)
      continue
    }
    const bulk = (await res.json()) as MlBulkResult[]
    for (const entry of bulk) {
      if (entry.status_code === 200) items.push(entry.body)
      else failedIds.push(entry.id)
    }
  }
  return { items, failedIds }
}

export async function fetchAllSellerItemIds(auth: HeadersInit, sellerId: number): Promise<string[]> {
  const itemIds: string[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const res = await fetch(`${ML_API}/users/${sellerId}/items/search?limit=${limit}&offset=${offset}`, {
      headers: auth,
    })
    if (!res.ok) throw new Error(`Falha ao listar anúncios (status ${res.status}): ${await res.text()}`)
    const search = (await res.json()) as { results: string[]; paging: { total: number } }
    itemIds.push(...search.results)
    offset += limit
    if (offset >= search.paging.total || search.results.length === 0) break
  }
  return itemIds
}

// Monta a linha pronta pra upsert em products, buscando marca (via
// compatibilidades de veículo) e descrição do anúncio. Falhas nessas
// buscas complementares não impedem o upsert — só ficam sem esse dado.
export async function buildProductRow(auth: HeadersInit, item: MlItem) {
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

  let description: string | null = null
  try {
    const descRes = await fetch(`${ML_API}/items/${item.id}/description`, { headers: auth })
    if (descRes.ok) {
      const desc = (await descRes.json()) as MlDescription
      const text = (desc.plain_text || desc.text || '').trim()
      description = text || null
    }
  } catch {
    // item sem descrição cadastrada — segue sem
  }

  return {
    ml_item_id: item.id,
    title: item.title,
    price: item.price,
    stock: item.available_quantity,
    status: item.status,
    images: (item.pictures ?? []).map((p) => p.secure_url ?? p.url),
    permalink: item.permalink,
    brand: brandGuess,
    category: guessCategory(item),
    description,
    sold_quantity: item.sold_quantity ?? 0,
    ml_attributes: { category_id: item.category_id, attributes: item.attributes ?? null, compatibilities },
    ml_updated_at: item.last_updated,
    synced_at: new Date().toISOString(),
  }
}

export type SyncSource = 'initial' | 'webhook' | 'cron'

export async function logSync(
  supabase: ReturnType<typeof createAdminClient>,
  source: SyncSource,
  entries: { ml_item_id: string; result: 'success' | 'error' | 'skipped'; error: string | null }[]
) {
  if (entries.length === 0) return
  await supabase.from('sync_log').insert(entries.map((e) => ({ ...e, source })))
}
