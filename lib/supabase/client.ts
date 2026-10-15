import { createBrowserClient } from '@supabase/ssr'

// flowType 'implicit' em vez do padrão 'pkce': o login do /admin é por
// link mágico aberto de dentro de apps de e-mail (Gmail, etc.), que
// costumam abrir o link numa aba/contexto separado do navegador que
// pediu o link. PKCE exige um "code verifier" salvo em cookie nesse
// MESMO contexto para completar a troca — como o app de e-mail abre
// outro contexto, o cookie nunca está lá, e a troca falha sempre
// ("PKCE code verifier not found in storage"), confirmado testando de
// verdade pelo Gmail no iPhone. O fluxo implícito manda o token direto
// na URL (#access_token=...), sem precisar de nada salvo de antemão —
// funciona em qualquer navegador/app que abrir o link.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { flowType: 'implicit' } }
  )
}
