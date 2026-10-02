'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Pra onde o link mágico redireciona. Precisa ser página (client), não
// rota de servidor: o Supabase pode devolver a sessão de duas formas —
// ?code=... (troca via exchangeCodeForSession) ou #access_token=...
// (fragmento da URL, que o navegador NUNCA envia pro servidor — só dá
// pra ler com JS no cliente). O client do @supabase/ssr já detecta e
// grava a sessão nos cookies sozinho nesse segundo caso
// (detectSessionInUrl, padrão); só precisamos confirmar que funcionou.
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
      } else if (window.location.hash.includes('access_token')) {
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          setError('Não foi possível confirmar o login.')
          return
        }
      } else {
        setError('Link de acesso inválido ou expirado. Peça um novo link em /admin/login.')
        return
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
