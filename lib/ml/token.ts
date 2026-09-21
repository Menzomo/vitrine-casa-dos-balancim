import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'
const EXPIRY_BUFFER_SECONDS = 60

type MlTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
}

// Fonte única de acesso a um access_token válido do Mercado Livre.
// Renova sozinho quando expirado (ou perto de expirar). Chame sempre esta
// função em vez de ler ml_credentials diretamente em outro lugar.
export async function getValidMlToken(): Promise<string> {
  const supabase = createAdminClient()

  const { data: credentials, error } = await supabase
    .from('ml_credentials')
    .select('seller_id, access_token, refresh_token, expires_at')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Falha ao ler ml_credentials: ${error.message}`)
  }
  if (!credentials) {
    throw new Error('Nenhuma credencial do Mercado Livre encontrada. Rode /api/ml/connect primeiro.')
  }

  const expiresAtMs = new Date(credentials.expires_at).getTime()
  if (Date.now() < expiresAtMs - EXPIRY_BUFFER_SECONDS * 1000) {
    return credentials.access_token
  }

  return refreshMlToken(supabase, {
    sellerId: credentials.seller_id,
    refreshToken: credentials.refresh_token,
  })
}

// Refresh token do ML é de uso único: cada renovação retorna um refresh_token
// novo que precisa ser salvo imediatamente. Para evitar que duas chamadas
// concorrentes renovem ao mesmo tempo (a segunda usaria um refresh_token já
// queimado pela primeira), o UPDATE só é aplicado se o refresh_token no
// banco ainda for o mesmo que usamos para pedir a renovação. Se outra
// chamada já venceu a corrida, relemos a linha (já atualizada por ela) em
// vez de tentar sobrescrever com um token que o ML já invalidou.
async function refreshMlToken(
  supabase: ReturnType<typeof createAdminClient>,
  { sellerId, refreshToken }: { sellerId: number; refreshToken: string }
): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ML_CLIENT_ID!,
      client_secret: process.env.ML_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha ao renovar token do ML (${response.status}): ${body}`)
  }

  const tokenData = (await response.json()) as MlTokenResponse
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('ml_credentials')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    })
    .eq('seller_id', sellerId)
    .eq('refresh_token', refreshToken)
    .select('access_token')
    .maybeSingle()

  if (updateError) {
    throw new Error(`Falha ao salvar novo token do ML: ${updateError.message}`)
  }

  if (updated) {
    return updated.access_token
  }

  const { data: current, error: reReadError } = await supabase
    .from('ml_credentials')
    .select('access_token')
    .eq('seller_id', sellerId)
    .single()

  if (reReadError || !current) {
    throw new Error('Refresh concorrente do token do ML: falha ao reler o token já atualizado.')
  }

  return current.access_token
}
