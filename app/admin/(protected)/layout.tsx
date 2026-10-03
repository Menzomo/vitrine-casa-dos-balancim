import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'

const NAV_LINKS = [
  { href: '/admin', label: 'Métricas' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/configuracoes', label: 'Textos' },
]

// Trava de acesso do painel: precisa estar logado E cadastrado em
// admin_users (checado via RPC is_admin(), já que a tabela em si não tem
// policy de leitura pra ninguém além da função). Só essa pasta
// "(protected)" passa por aqui — /admin/login fica de fora.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="border-b border-[#E7E7E5] bg-white">
        <div className="container flex h-16 flex-wrap items-center justify-between gap-4">
          <span className="font-[var(--font-poppins)] font-bold text-[#111]">Painel Casa dos Balancim</span>
          <nav className="flex items-center gap-5 text-sm font-medium text-[#6B6B6B]">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#B58A2E]">
                {link.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  )
}
