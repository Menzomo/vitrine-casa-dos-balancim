import { createClient } from '@supabase/supabase-js'

// Client separado, só pro passo de pedir o link mágico (signInWithOtp).
// createBrowserClient (@supabase/ssr), usado no resto do app, força
// flowType "pkce" internamente e ignora qualquer flowType passado nas
// opções — confirmado inspecionando o bundle publicado. PKCE exige um
// "code verifier" salvo em storage no MESMO navegador/aba que completa
// a troca; um link de e-mail aberto em outro contexto (app de e-mail,
// outra aba do Safari, outro dispositivo) nunca tem esse valor
// disponível, e a troca falha com "PKCE code verifier not found in
// storage" — reproduzido de verdade clicando o link pelo Gmail no
// iPhone, mesmo abrindo no Safari. O client puro do
// @supabase/supabase-js (sem o wrapper do ssr) respeita flowType
// "implicit" de verdade: o token vai direto na URL do e-mail
// (#access_token=...), sem precisar de nada salvo antes — funciona em
// qualquer navegador/aba que abrir o link. persistSession/
// autoRefreshToken ficam desligados porque esse client só serve pra
// essa chamada; a sessão de verdade é criada depois, em
// /auth/callback, pelo client de lib/supabase/client.ts (que grava em
// cookie, pro servidor conseguir ler).
export function createLoginClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false },
  })
}
