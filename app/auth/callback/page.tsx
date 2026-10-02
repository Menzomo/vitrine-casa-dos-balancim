'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Pra onde o link mágico redireciona. Precisa ser página (client), não
// rota de servidor: o Supabase pode devolver a sessão de duas formas —
// ?code=... (troca via exchangeCodeForSession) ou #access_token=...
// (fragmento da URL, que o navegador NUNCA envia pro servidor — só dá
// pra ler com JS no cliente). Setamos a sessão explicitamente com
// setSession() em vez de confiar na autodetecção (detectSessionInUrl):
// essa autodetecção roda de forma assíncrona na inicialização do client
// e numa corrida com um getSession() logo em seguida, às vezes perde.
export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    async function handle() {
      const supabase = createClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError(error.message)
          return
        }
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
