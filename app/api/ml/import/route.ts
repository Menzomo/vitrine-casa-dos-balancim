import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidMlToken } from '@/lib/ml/token'
import { ALLOWED_CATEGORY_IDS, UA, buildProductRow, fetchAllSellerItemIds, fetchItemsBulk, logSync } from '@/lib/ml/sync'

// Carga inicial (etapa 4): busca todos os anúncios do vendedor, filtra só
// as categorias de balancim/acessórios, e faz upsert em products. Uso
// manual — o Bruno acessa essa URL quando quiser (re)popular tudo de uma
// vez; a partir da etapa 7, produto a produto é mantido pelo webhook +
// cron de reconciliação.
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

  const itemIds = await fetchAllSellerItemIds(auth, cred.seller_id)
  const { items, failedIds } = await fetchItemsBulk(auth, itemIds)
  await logSync(
    supabase,
    'initial',
    failedIds.map((id) => ({ ml_item_id: id, result: 'error', error: 'falha ao buscar detalhes do item' }))
  )

  const included = items.filter((item) => ALLOWED_CATEGORY_IDS.has(item.category_id))
  const skipped = items.filter((item) => !ALLOWED_CATEGORY_IDS.has(item.category_id))

  await logSync(
    supabase,
    'initial',
    skipped.map((item) => ({
      ml_item_id: item.id,
      result: 'skipped',
      error: `categoria ${item.category_id} fora do escopo (não é balancim)`,
    }))
  )

  const rows = []
  const syncEntries = []
  for (const item of included) {
    rows.push(await buildProductRow(auth, item))
    syncEntries.push({ ml_item_id: item.id, result: 'success' as const, error: null })
  }

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from('products').upsert(rows, { onConflict: 'ml_item_id' })
    if (upsertError) {
      return report(`Falha ao salvar produtos: ${upsertError.message}`, null)
    }
  }
  await logSync(supabase, 'initial', syncEntries)

  // Relatório: produtos ativos por marca (só o que foi importado agora).
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

function report(error: string | null, data: unknown) {
  const body = error ? { error } : { ok: true, ...(data as object) }
  return NextResponse.json(body, { status: error ? 500 : 200 })
}
