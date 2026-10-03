import Link from 'next/link'
import { Footer, Header } from '@/components/storefront'
import { getSettings } from '@/lib/settings'

export default async function NotFound() {
  const settings = await getSettings()
  return (
    <div className="min-h-screen bg-white">
      <Header whatsappNumber={settings.whatsapp_number} />
      <main className="container flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B58A2E]">Erro 404</p>
        <h1 className="mt-3 text-3xl font-bold text-[#111]">Página não encontrada</h1>
        <p className="mt-3 max-w-md text-sm text-[#6B6B6B]">
          O link pode estar errado, ou o produto não está mais disponível. Dá uma olhada no nosso catálogo completo.
        </p>
        <Link href="/produtos" className="mt-6 inline-flex h-12 items-center rounded bg-[#B58A2E] px-6 text-sm font-semibold text-white transition hover:bg-[#8e6b20]">
          Ver catálogo
        </Link>
      </main>
      <Footer whatsappNumber={settings.whatsapp_number} businessHours={settings.business_hours} aboutText={settings.footer_about} />
    </div>
  )
}
