import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Pra onde o link mágico redireciona: troca o "code" da URL pela sessão
// de verdade (grava o cookie via lib/supabase/server.ts) e manda pro
// painel. Se der errado, volta pro login.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/admin', url.origin))
    }
  }

  return NextResponse.redirect(new URL('/admin/login', url.origin))
}
