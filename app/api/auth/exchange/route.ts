import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Troca do código PKCE (?code=...) por sessão, feita no servidor.
// O verifier do PKCE fica guardado num cookie (via @supabase/ssr), não
// no localStorage — por isso essa troca precisa rodar aqui, lendo
// cookies pelo createClient() de servidor, em vez de no client
// component de /auth/callback. Trocar pelo client component direto
// falhava com "PKCE code verifier not found in storage" sempre que o
// link era aberto numa aba/contexto que não preservava esse cookie
// (ex: clicado de dentro do Gmail).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent('Link de acesso inválido.')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/admin`)
}
