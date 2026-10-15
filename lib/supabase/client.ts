import { createBrowserClient } from '@supabase/ssr'

// Nota: createBrowserClient (@supabase/ssr) força flowType "pkce" por
// dentro, ignorando silenciosamente qualquer flowType passado aqui —
// confirmado inspecionando o bundle gerado. Pra login por link mágico
// com flowType "implicit" (ver lib/supabase/login-client.ts e o porquê
// lá), usamos um client separado só pra esse passo.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
