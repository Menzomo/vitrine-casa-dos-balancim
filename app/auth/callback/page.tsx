'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Pra onde o link mágico redireciona. Supabase pode devolver a sessão
// de duas formas — ?code=... (fluxo PKCE, usado pelo signInWithOtp()
// real do /admin/login) ou #access_token=... (fragmento da URL, que o
// navegador NUNCA envia pro servidor — só dá pra ler com JS no
// cliente).
//
// O caso ?code= é encaminhado pra /api/auth/exchange (rota de
// servidor): o verifier do PKCE fica num cookie que só o cliente
// server-side consegue ler de forma confiável via createClient() de
// servidor. Tentar trocar o código aqui, no client component, falhava
// com "PKCE code verifier not found in storage" sempre que o link era
// aberto num contexto sem esse cookie — comum ao abrir o link de
// dentro do Gmail.
//
// O caso #access_token= só existe no fragmento, então só pode ser
// tratado aqui mesmo: setamos a sessão explicitamente com setSession()
// em vez de confiar na autodetecção (detectSessionInUrl), que roda de
// forma assíncrona na inicialização do client e entra em corrida com
// um getSession() logo em seguida, às vezes perdendo.
export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    async function handle() {
      const supabase = createClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        window.location.href = `/api/auth/exchange?code=${encodeURIComponent(code)}`
        return
      } else {
        const hashParams = new URLSearchParams(window.location.hash.slice(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (error) {
            setError(error.message)
            return
          }
        } else {
          setError('Link de acesso inválido ou expirado. Peça um novo link em /admin/login.')
          return
        }
      }

      router.replace('/admin')
    }
    handle()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3] p-6">
      <p className="text-sm text-[#6B6B6B]">{error || 'Confirmando login...'}</p>
    </div>
  )
}
