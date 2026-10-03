import { createPublicClient } from './supabase/public'

// Valores padrão caso a tabela esteja vazia ou inacessível — o site nunca
// deve quebrar por causa de um texto institucional faltando.
const DEFAULTS: Record<string, string> = {
  whatsapp_number: '5500000000000',
  business_hours: 'Seg a sex, das 8h às 18h',
  footer_about: 'Peças para quem entende de motor. Especialistas em balancins de válvula para veículos leves e pesados.',
}

export type Settings = typeof DEFAULTS

export async function getSettings(): Promise<Settings> {
  const supabase = createPublicClient()
  const { data, error } = await supabase.from('site_settings').select('key, value')

  if (error) {
    console.error('Falha ao buscar site_settings:', error.message)
    return { ...DEFAULTS }
  }

  const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
  return { ...DEFAULTS, ...map }
}
