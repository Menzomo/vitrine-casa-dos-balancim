import { createClient } from '@/lib/supabase/server'
import { createBanner, deleteBanner, toggleBannerActive } from '../actions'

type BannerRow = {
  id: string
  title: string
  description: string | null
  link_url: string | null
  active: boolean
  position: number
}

export default async function AdminBannersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('banners')
    .select('id, title, description, link_url, active, position')
    .order('position', { ascending: true })

  const banners = (data ?? []) as BannerRow[]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Banners</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#6B6B6B]">
          Avisos/promoções mostrados na home. Só os marcados como ativos aparecem no site, na ordem da posição (menor
          primeiro).
        </p>
      </div>

      <div className="overflow-hidden rounded border border-[#E7E7E5] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF8F3] text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Posição</th>
              <th className="px-4 py-3">Ativo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6B6B6B]">
                  Nenhum banner cadastrado ainda.
                </td>
              </tr>
            )}
            {banners.map((banner) => (
              <tr key={banner.id} className="border-t border-[#E7E7E5]">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#111]">{banner.title}</p>
                  {banner.description && <p className="text-xs text-[#6B6B6B]">{banner.description}</p>}
                </td>
                <td className="px-4 py-3 text-[#111]">{banner.position}</td>
                <td className="px-4 py-3">
                  <form action={toggleBannerActive.bind(null, banner.id, !banner.active)}>
                    <button
                      type="submit"
                      className={`rounded px-3 py-1.5 text-xs font-semibold ${banner.active ? 'bg-[#B58A2E]/10 text-[#B58A2E]' : 'bg-[#FAF8F3] text-[#6B6B6B]'}`}
                    >
                      {banner.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={deleteBanner.bind(null, banner.id)}>
                    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded border border-[#E7E7E5] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#111]">Novo banner</h2>
        <form action={createBanner} className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B6B6B]">Título *</label>
            <input name="title" required className="mt-1 h-11 w-full rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B]">Descrição</label>
            <input name="description" className="mt-1 h-11 w-full rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B]">Link (opcional, pra onde o banner leva ao clicar)</label>
            <input name="link_url" placeholder="/produtos?categoria=conjunto" className="mt-1 h-11 w-full rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B]">URL da imagem (opcional)</label>
            <input name="image_url" className="mt-1 h-11 w-full rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B]">Posição</label>
            <input type="number" name="position" defaultValue={0} className="mt-1 h-11 w-24 rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]" />
          </div>
          <button type="submit" className="mt-2 h-11 self-start rounded bg-[#B58A2E] px-6 text-sm font-semibold text-white hover:bg-[#8e6b20]">
            Criar banner
          </button>
        </form>
      </section>
    </div>
  )
}
