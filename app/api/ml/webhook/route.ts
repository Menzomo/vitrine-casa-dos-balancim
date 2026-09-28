import { after, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidMlToken } from '@/lib/ml/token'
import { ALLOWED_CATEGORY_IDS, UA, buildProductRow, fetchItem, logSync } from '@/lib/ml/sync'

type MlNotification = {
  topic: string
  resource: string
  user_id: number
  application_id: number
}

// Webhook do tópico "items". Segurança: o ML não assina o corpo da
// notificação, então NUNCA confiamos nos dados que vêm nela — só usamos
// pra saber "o que" mudou (qual item) e sempre rebuscamos o dado real na
// API com nosso próprio token. As checagens abaixo (user_id/application_id
// esperados, e seller_id do item já rebuscado) impedem que alguém injete
// produto de outro vendedor mandando POST direto pra essa URL.
export async function POST(request: Request) {
  let body: MlNotification
  try {
    body = await request.json()
  } catch {
    return new NextResponse('corpo inválido', { status: 400 })
  }

  if (body.topic !== 'items' || !body.resource?.startsWith('/items/')) {
    // Responde 200 mesmo assim — não é um erro nosso, só não é algo que
    // processamos (o ML pode reenviar outros tópicos no futuro).
    return new NextResponse(null, { status: 200 })
  }

  const supabase = createAdminClient()
  const { data: cred } = await supabase.from('ml_credentials').select('seller_id').single()

  if (!cred || String(body.user_id) !== String(cred.seller_id)) {
    // Notificação não é da nossa conta — ignora sem processar.
    return new NextResponse(null, { status: 200 })
  }

  const itemId = body.resource.replace('/items/', '')

  // Responde rápido pro ML não reenviar por timeout; processa depois.
  after(() => processItemUpdate(supabase, itemId))

  return new NextResponse(null, { status: 200 })
}

async function processItemUpdate(supabase: ReturnType<typeof createAdminClient>, itemId: string) {
  try {
    const { data: cred } = await supabase.from('ml_credentials').select('seller_id').single()
    if (!cred) return

    const accessToken = await getValidMlToken()
    const auth = { Authorization: `Bearer ${accessToken}`, ...UA }

    const item = await fetchItem(auth, itemId)
    if (!item) {
      await logSync(supabase, 'webhook', [{ ml_item_id: itemId, result: 'error', error: 'falha ao rebuscar item na API do ML' }])
      return
    }

    // Confere que o item pertence à conta conectada — protege contra uma
    // notificação forjada apontando pro item de outro vendedor.
    if (String(item.seller_id) !== String(cred.seller_id)) {
      await logSync(supabase, 'webhook', [{ ml_item_id: itemId, result: 'skipped', error: 'item não pertence ao vendedor conectado' }])
      return
    }

    if (!ALLOWED_CATEGORY_IDS.has(item.category_id)) {
      await logSync(supabase, 'webhook', [{ ml_item_id: itemId, result: 'skipped', error: `categoria ${item.category_id} fora do escopo` }])
      return
    }

    const row = await buildProductRow(auth, item)
    const { error: upsertError } = await supabase.from('products').upsert(row, { onConflict: 'ml_item_id' })

    if (upsertError) {
      await logSync(supabase, 'webhook', [{ ml_item_id: itemId, result: 'error', error: upsertError.message }])
      return
    }

    await logSync(supabase, 'webhook', [{ ml_item_id: itemId, result: 'success', error: null }])

    revalidatePath(`/produtos/${itemId}`)
    revalidatePath('/produtos')
    revalidatePath('/')
  } catch (err) {
    await logSync(supabase, 'webhook', [
      { ml_item_id: itemId, result: 'error', error: err instanceof Error ? err.message : 'erro desconhecido' },
    ])
  }
}
