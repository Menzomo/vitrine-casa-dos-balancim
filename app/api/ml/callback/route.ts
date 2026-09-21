import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const STATE_COOKIE = 'ml_oauth_state'
const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'

type MlTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: number
}

// Recebe o "code" do Mercado Livre, troca por access_token/refresh_token e
// salva em ml_credentials. Página simples de status — uso interno único
// (setup manual), não faz parte da vitrine pública.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const mlError = url.searchParams.get('error')

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)

  if (mlError) {
    return statusPage(`Autorização cancelada pelo Mercado Livre: ${mlError}`, 400)
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return statusPage(
      'Falha na validação do OAuth (state ausente ou inválido). Tente conectar novamente em /api/ml/connect.',
      400
    )
  }

  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ML_CLIENT_ID!,
      client_secret: process.env.ML_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.ML_REDIRECT_URI!,
    }),
  })

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text()
    console.error('Falha ao trocar code por token do ML:', tokenResponse.status, body)
    return statusPage('Falha ao conectar com o Mercado Livre. Veja os logs do servidor para detalhes.', 502)
  }

  const tokenData = (await tokenResponse.json()) as MlTokenResponse
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  const supabase = createAdminClient()
  const { error: upsertError } = await supabase.from('ml_credentials').upsert(
    {
      seller_id: tokenData.user_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    },
    { onConflict: 'seller_id' }
  )

  if (upsertError) {
    console.error('Falha ao salvar ml_credentials:', upsertError.message)
    return statusPage('Token obtido, mas falhou ao salvar no banco. Veja os logs do servidor.', 500)
  }

  return statusPage(`Mercado Livre conectado com sucesso. Seller ID: ${tokenData.user_id}`, 200)
}

function statusPage(message: string, status: number) {
  return new NextResponse(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><body style="font-family:sans-serif;padding:2rem"><p>${message}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
