import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SESSION_COOKIE = 'cb_sid'
const SESSION_MAX_AGE = 60 * 60 * 24 * 180 // 180 dias

// Redirect rastreado do botão Comprar: grava o clique em site_events
// (via service role, já que anon não tem permissão de escrever ali) e só
// então manda pro anúncio real no Mercado Livre. Nenhum link do site
// aponta direto pro ML fora daqui.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  const supabase = createAdminClient()

  // Mesma regra de visibilidade da vitrine (RLS replicada manualmente,
  // já que o client admin ignora RLS): se o produto não está visível,
  // o link de compra também não deve funcionar.
  const { data: product } = await supabase
    .from('products')
    .select('id, permalink')
    .eq('ml_item_id', id)
    .eq('status', 'active')
    .gt('stock', 0)
    .eq('hidden', false)
    .maybeSingle()

  if (!product) {
    return NextResponse.redirect(new URL('/produtos', request.url))
  }

  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
  }

  const url = new URL(request.url)
  const { error: insertError } = await supabase.from('site_events').insert({
    type: 'buy_click',
    product_id: product.id,
    session_id: sessionId,
    referrer: request.headers.get('referer'),
    utm_source: url.searchParams.get('utm_source'),
    utm_medium: url.searchParams.get('utm_medium'),
    utm_campaign: url.searchParams.get('utm_campaign'),
    utm_term: url.searchParams.get('utm_term'),
    utm_content: url.searchParams.get('utm_content'),
    user_agent: request.headers.get('user-agent'),
  })
  // Falha ao gravar o evento nunca deve travar a compra — só loga.
  if (insertError) console.error('Falha ao gravar site_events:', insertError.message)

  return NextResponse.redirect(product.permalink)
}
