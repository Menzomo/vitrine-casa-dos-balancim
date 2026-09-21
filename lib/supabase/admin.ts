import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente privilegiado: ignora toda RLS via SUPABASE_SERVICE_ROLE_KEY.
// Só pode ser usado em código server-only (rotas /go/[id], webhook do ML,
// getValidMlToken, etc). O import de 'server-only' quebra o build se este
// arquivo acabar sendo importado por um componente client por engano.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
