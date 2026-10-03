'use client'

// Só dispara se o erro acontecer no próprio layout raiz (bem raro).
// Precisa renderizar <html>/<body> porque substitui o layout inteiro.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-[#111]">Algo deu errado</h1>
          <p className="mt-3 max-w-md text-sm text-[#6B6B6B]">Tente novamente em alguns instantes.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 h-11 rounded bg-[#B58A2E] px-6 text-sm font-semibold text-white"
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  )
}
