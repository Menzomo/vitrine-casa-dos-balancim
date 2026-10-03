'use client'

import { useEffect } from 'react'

// Captura erros de runtime dentro de uma rota (precisa ser client
// component — regra do Next). Sem Header/Footer aqui porque eles
// dependem de settings buscado no servidor, e esse limite é client-only.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B58A2E]">Ops</p>
      <h1 className="mt-3 text-2xl font-bold text-[#111]">Algo deu errado</h1>
      <p className="mt-3 max-w-md text-sm text-[#6B6B6B]">
        Tente novamente em alguns instantes. Se o problema continuar, fale com a gente pelo WhatsApp.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-11 rounded bg-[#B58A2E] px-6 text-sm font-semibold text-white transition hover:bg-[#8e6b20]"
      >
        Tentar de novo
      </button>
    </div>
  )
}
