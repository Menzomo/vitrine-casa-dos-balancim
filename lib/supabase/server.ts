import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente para Server Components / Route Handlers / Server Actions.
// Usa a chave pública (respeita RLS) e lê/grava o cookie de sessão do
// usuário logado — necessário a partir da etapa 8 (auth do /admin).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado de um Server Component sem permissão de escrever
            // cookie; inofensivo desde que a sessão seja renovada em
            // algum middleware (a implementar na etapa 8).
          }
        },
      },
    }
  )
}
