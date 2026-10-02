import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateSessionId } from '@/lib/analytics/session'

const VALID_TYPES = new Set(['pageview', 'product_view'])

type TrackBody = {
  type: string
  productId?: string
  path?: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
}

// Recebe os eventos de pageview/product_view do PageTracker (client
// component). buy_click não passa por aqui — esse é gravado direto no
// /go/[id], no mesmo request do redirect. Nunca deixa um erro aqui
// quebrar a navegação: sempre responde 200/204, no máximo loga.
export async function POST(request: Request) {
  let body: TrackBody
  try {
    body = await request.json()
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  if (!VALID_TYPES.has(body.type)) {
    return new NextResponse(null, { status: 204 })
  }

  try {
    const supabase = createAdminClient()
    const cookieStore = await cookies()
    const sessionId = await getOrCreateSessionId(cookieStore)

    let productId: string | null = null
    if (body.type === 'product_view' && body.productId) {
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('ml_item_id', body.productId)
        .maybeSingle()
      productId = product?.id ?? null
    }

    const { error } = await supabase.from('site_events').insert({
      type: body.type,
      product_id: productId,
      session_id: sessionId,
      referrer: request.headers.get('referer'),
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      utm_term: body.utm_term ?? null,
      utm_content: body.utm_content ?? null,
      user_agent: request.headers.get('user-agent'),
    })
    if (error) console.error('Falha ao gravar site_events:', error.message)
  } catch (err) {
    console.error('Falha no /api/track:', err instanceof Error ? err.message : err)
  }

  return new NextResponse(null, { status: 204 })
}
