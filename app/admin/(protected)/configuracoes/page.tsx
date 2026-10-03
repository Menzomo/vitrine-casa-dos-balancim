import { getSettings } from '@/lib/settings'
import { updateSettings } from '../actions'

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Textos institucionais</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#6B6B6B]">
          Esses textos aparecem no cabeçalho, rodapé e botões de WhatsApp do site inteiro.
        </p>
      </div>

      <form action={updateSettings} className="flex max-w-lg flex-col gap-4 rounded border border-[#E7E7E5] bg-white p-6">
        <div>
          <label className="text-xs font-medium text-[#6B6B6B]">Número de WhatsApp (só números, com DDI 55 e DDD)</label>
          <input
            name="whatsapp_number"
            defaultValue={settings.whatsapp_number}
            placeholder="5554981319593"
            className="mt-1 h-11 w-full rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B6B]">Horário de atendimento (texto livre)</label>
          <input
            name="business_hours"
            defaultValue={settings.business_hours}
            className="mt-1 h-11 w-full rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B6B]">Descrição curta no rodapé</label>
          <textarea
            name="footer_about"
            defaultValue={settings.footer_about}
            rows={3}
            className="mt-1 w-full rounded border border-[#E7E7E5] px-3 py-2 text-sm outline-none focus:border-[#B58A2E]"
          />
        </div>
        <button type="submit" className="mt-2 h-11 self-start rounded bg-[#B58A2E] px-6 text-sm font-semibold text-white hover:bg-[#8e6b20]">
          Salvar
        </button>
      </form>
    </div>
  )
}
