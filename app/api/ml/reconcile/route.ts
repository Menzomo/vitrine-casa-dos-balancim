import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidMlToken } from '@/lib/ml/token'
import { ALLOWED_CATEGORY_IDS, UA, buildProductRow, fetchAllSellerItemIds, fetchItemsBulk, logSync } from '@/lib/ml/sync'

// Rede de segurança que roda periodicamente (pg_cron): revarre todos os
// anúncios do vendedor, corrige o que o webhook perdeu, e marca como
// "closed" o que sumiu do Mercado Livre. Protegido por segredo (não é
// algo que o ML chama — é o nosso próprio cron batendo aqui).
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    const { data: cred } = await supabase.from('ml_credentials').select('seller_id').single()
    if (!cred) return NextResponse.json({ error: 'Nenhuma credencial do Mercado Livre encontrada.' }, { status: 500 })

    const accessToken = await getValidMlToken()
    const auth = { Authorization: `Bearer ${accessToken}`, ...UA }

    const itemIds = await fetchAllSellerItemIds(auth, cred.seller_id)
    const { items, failedIds } = await fetchItemsBulk(auth, itemIds)
    await logSync(
      supabase,
      'cron',
      failedIds.map((id) => ({ ml_item_id: id, result: 'error', error: 'falha ao buscar detalhes do item' }))
    )

    const included = items.filter((item) => ALLOWED_CATEGORY_IDS.has(item.category_id))

    const rows = []
    for (const item of included) rows.push(await buildProductRow(auth, item))

    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from('products').upsert(rows, { onConflict: 'ml_item_id' })
      if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }
    await logSync(
      supabase,
      'cron',
      rows.map((r) => ({ ml_item_id: r.ml_item_id, result: 'success' as const, error: null }))
    )

    // O que existe no nosso banco mas sumiu do ML (excluído/expirado): marca
    // como encerrado, não deleta — mantém o histórico e continua invisível
    // na vitrine (RLS só mostra status='active').
    const currentIds = new Set(included.map((i) => i.id))
    const { data: dbProducts } = await supabase.from('products').select('ml_item_id, status')
    const missing = (dbProducts ?? []).filter((p) => !currentIds.has(p.ml_item_id) && p.status !== 'closed')

    if (missing.length > 0) {
      await supabase
        .from('products')
        .update({ status: 'closed', synced_at: new Date().toISOString() })
        .in(
          'ml_item_id',
          missing.map((m) => m.ml_item_id)
        )
      await logSync(
        supabase,
        'cron',
        missing.map((m) => ({ ml_item_id: m.ml_item_id, result: 'success' as const, error: 'marcado como encerrado (sumiu do ML)' }))
      )
    }

    for (const item of included) revalidatePath(`/produtos/${item.id}`)
    for (const m of missing) revalidatePath(`/produtos/${m.ml_item_id}`)
    revalidatePath('/produtos')
    revalidatePath('/')

    return NextResponse.json({
      ok: true,
      totalNaConta: itemIds.length,
      atualizados: rows.length,
      encerrados: missing.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    console.error('Falha no reconcile:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function isAuthorized(request: Request): boolean {
  const header = request.headers.get('authorization')
  const expected = process.env.ML_RECONCILE_SECRET
  if (!expected || !header?.startsWith('Bearer ')) return false
  const provided = Buffer.from(header.slice(7))
  const secret = Buffer.from(expected)
  if (provided.length !== secret.length) return false
  return crypto.timingSafeEqual(provided, secret)
}
