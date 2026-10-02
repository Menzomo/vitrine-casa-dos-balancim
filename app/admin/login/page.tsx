'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3] p-6">
      <div className="w-full max-w-sm rounded border border-[#E7E7E5] bg-white p-8">
        <h1 className="font-[var(--font-poppins)] text-xl font-bold text-[#111]">Painel Casa dos Balancim</h1>
        <p className="mt-2 text-sm text-[#6B6B6B]">Acesso restrito à equipe da loja.</p>
        {status === 'sent' ? (
          <p className="mt-6 rounded bg-[#FAF8F3] p-4 text-sm text-[#111]">
            Enviamos um link de acesso pro e-mail <strong>{email}</strong>. Abra sua caixa de entrada e clique no link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11 rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="h-11 rounded bg-[#B58A2E] text-sm font-semibold text-white transition hover:bg-[#8e6b20] disabled:opacity-60"
            >
              {status === 'sending' ? 'Enviando...' : 'Receber link de acesso'}
            </button>
            {status === 'error' && <p className="text-xs text-red-600">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
