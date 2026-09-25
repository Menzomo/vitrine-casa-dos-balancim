import { createClient } from '@supabase/supabase-js'

// Client anônimo (chave pública, respeita RLS) sem dependência de cookies —
// seguro de chamar em build time (generateStaticParams/generateMetadata) e
// em Server Components. Usado só para leituras públicas da vitrine; nada de
// sessão de usuário aqui (isso é lib/supabase/server.ts, a partir da etapa 8).
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
