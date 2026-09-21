import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const STATE_COOKIE = 'ml_oauth_state'

// Ponto de entrada manual (rodado pelo Bruno) para autorizar o app no
// Mercado Livre. Gera um "state" aleatório contra CSRF, guarda num cookie
// de curta duração e redireciona pra tela de autorização do ML.
export async function GET() {
  const state = crypto.randomUUID()

  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  const authorizeUrl = new URL('https://auth.mercadolivre.com.br/authorization')
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', process.env.ML_CLIENT_ID!)
  authorizeUrl.searchParams.set('redirect_uri', process.env.ML_REDIRECT_URI!)
  authorizeUrl.searchParams.set('state', state)

  return NextResponse.redirect(authorizeUrl)
}
