'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/admin/login')
        router.refresh()
      }}
      className="text-sm font-medium text-[#6B6B6B] hover:text-[#B58A2E]"
    >
      Sair
    </button>
  )
}
