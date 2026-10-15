import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type ProductRef = { ml_item_id: string; title: string } | { ml_item_id: string; title: string }[] | null

type PageviewRow = { created_at: string; session_id: string; referrer: string | null; utm_source: string | null }
type ProductEventRow = { products: ProductRef }

// Brasil não observa horário de verão desde 2019 — UTC-3 fixo, sem
// precisar de lógica de fuso dinâmica. Todo o cálculo de "dia" nessa
// página usa isso, pra não bater meia-noite em UTC e já contar como
// amanhã (o que antes acontecia a partir das 21h em Brasília).
const BR_TZ = 'America/Sao_Paulo'

function brTodayString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: BR_TZ })
}

function brDateFromTimestamp(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: BR_TZ })
}

function formatBrDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function addDaysStr(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00.000Z`) // meio-dia UTC evita virar de dia por arredondamento
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function startOfMonthStr(dateStr: string) {
  return `${dateStr.slice(0, 7)}-01`
}

// Converte um dia (YYYY-MM-DD, calendário de Brasília) pro intervalo
// UTC correspondente, pra filtrar site_events.created_at (timestamptz).
function brStartOfDayUTC(dateStr: string) {
  return `${dateStr}T03:00:00.000Z`
}
function brEndOfDayUTC(dateStr: string) {
  return `${addDaysStr(dateStr, 1)}T02:59:59.999Z`
}

function rangeForPreset(preset: string, today: string): { from: string; to: string } {
  if (preset === 'mes-passado') {
    const firstThisMonth = startOfMonthStr(today)
    const lastDayPrevMonth = addDaysStr(firstThisMonth, -1)
    const firstPrevMonth = startOfMonthStr(lastDayPrevMonth)
    return { from: firstPrevMonth, to: lastDayPrevMonth }
  }
  if (preset === 'ultimos-30') {
    return { from: addDaysStr(today, -29), to: today }
  }
  if (preset === 'tudo') {
    return { from: '2026-01-01', to: today }
  }
  // 'este-mes' (padrão)
  return { from: startOfMonthStr(today), to: today }
}

const SITE_HOSTNAMES = ['casadosbalancim.com.br', 'www.casadosbalancim.com.br']

function originFromEvent(referrer: string | null, utmSource: string | null) {
  if (utmSource) return utmSource
  if (!referrer) return 'direto'
  try {
    const host = new URL(referrer).hostname.toLowerCase()
    // Navegação dentro do próprio site (ex: recarregou uma página
    // interna) não é um "canal de origem" de verdade — conta como
    // direto, não como "outro site".
    if (SITE_HOSTNAMES.includes(host) || host.endsWith('.vercel.app')) return 'direto'
  } catch {
    // referrer não é uma URL válida — ignora e segue pro match de texto
  }
  const r = referrer.toLowerCase()
  if (r.includes('instagram')) return 'instagram'
  if (r.includes('google')) return 'google'
  if (r.includes('facebook') || r.includes('fb.')) return 'facebook'
  if (r.includes('whatsapp') || r.includes('wa.me')) return 'whatsapp'
  return 'outro site'
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>
}) {
  const params = await searchParams
  const today = brTodayString()

  const { from, to } = params.from && params.to ? { from: params.from, to: params.to } : rangeForPreset(params.preset ?? 'este-mes', today)

  const fromTimestamp = brStartOfDayUTC(from)
  const toTimestamp = brEndOfDayUTC(to)

  const supabase = await createClient()

  const [pageviewsRes, productViewsRes, buyClicksRes] = await Promise.all([
    supabase
      .from('site_events')
      .select('created_at, session_id, referrer, utm_source')
      .eq('type', 'pageview')
      .gte('created_at', fromTimestamp)
      .lte('created_at', toTimestamp),
    supabase
      .from('site_events')
      .select('products(ml_item_id, title)')
      .eq('type', 'product_view')
      .gte('created_at', fromTimestamp)
      .lte('created_at', toTimestamp),
    supabase
      .from('site_events')
      .select('products(ml_item_id, title)')
      .eq('type', 'buy_click')
      .gte('created_at', fromTimestamp)
      .lte('created_at', toTimestamp),
  ])

  const pageviews = (pageviewsRes.data ?? []) as PageviewRow[]
  const productViewEvents = (productViewsRes.data ?? []) as ProductEventRow[]
  const buyClickEvents = (buyClicksRes.data ?? []) as ProductEventRow[]

  const totalVisits = pageviews.length
  const uniqueVisitors = new Set(pageviews.map((p) => p.session_id)).size

  const visitsByDayMap = new Map<string, number>()
  for (const p of pageviews) {
    const day = brDateFromTimestamp(p.created_at)
    visitsByDayMap.set(day, (visitsByDayMap.get(day) ?? 0) + 1)
  }
  const visitsByDay = [...visitsByDayMap.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))

  const sourcesMap = new Map<string, number>()
  for (const p of pageviews) {
    const origem = originFromEvent(p.referrer, p.utm_source)
    sourcesMap.set(origem, (sourcesMap.get(origem) ?? 0) + 1)
  }
  const sources = [...sourcesMap.entries()].sort((a, b) => b[1] - a[1])

  function groupByProduct(events: ProductEventRow[]) {
    const map = new Map<string, { title: string; count: number }>()
    for (const e of events) {
      const product = Array.isArray(e.products) ? e.products[0] : e.products
      if (!product) continue
      const current = map.get(product.ml_item_id)
      map.set(product.ml_item_id, { title: product.title, count: (current?.count ?? 0) + 1 })
    }
    return [...map.entries()].map(([ml_item_id, v]) => ({ ml_item_id, ...v })).sort((a, b) => b.count - a.count)
  }

  const topViewed = groupByProduct(productViewEvents).slice(0, 10)
  const topClicks = groupByProduct(buyClickEvents).slice(0, 10)
  const totalClicks = buyClickEvents.length

  const activePreset = !params.from && !params.to ? (params.preset ?? 'este-mes') : null

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Métricas</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#6B6B6B]">
          Medimos visitas ao site e cliques em &quot;Comprar&quot; que saíram pro Mercado Livre — isso mostra interesse, não
          a venda concluída. O Mercado Livre não nos informa quais cliques viraram pedido.
        </p>
      </div>

      <section className="flex flex-wrap items-end gap-4 rounded border border-[#E7E7E5] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'este-mes', label: 'Este mês' },
            { key: 'mes-passado', label: 'Mês passado' },
            { key: 'ultimos-30', label: 'Últimos 30 dias' },
            { key: 'tudo', label: 'Tudo' },
          ].map((p) => (
            <Link
              key={p.key}
              href={`/admin?preset=${p.key}`}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                activePreset === p.key ? 'bg-[#B58A2E] text-white' : 'bg-[#FAF8F3] text-[#6B6B6B] hover:bg-[#D4B05A]/20'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <form action="/admin" method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B]">De</label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="mt-1 h-10 rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B]">Até</label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="mt-1 h-10 rounded border border-[#E7E7E5] px-3 text-sm outline-none focus:border-[#B58A2E]"
            />
          </div>
          <button type="submit" className="h-10 rounded bg-[#111] px-4 text-sm font-semibold text-white hover:bg-[#B58A2E]">
            Filtrar
          </button>
        </form>
        <p className="w-full text-xs text-[#6B6B6B]">
          Período: {formatBrDate(from)} até {formatBrDate(to)}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Visitas no período" value={totalVisits} />
        <StatCard label="Visitantes únicos" value={uniqueVisitors} />
        <StatCard label="Produtos com visualização" value={topViewed.length} />
        <StatCard label="Cliques em Comprar" value={totalClicks} />
      </div>

      <Section title="Visitas por dia">
        <Table
          headers={['Dia', 'Visitas']}
          rows={visitsByDay.map(([day, count]) => [formatBrDate(day), String(count)])}
          empty="Sem visitas registradas nesse período."
        />
      </Section>

      <Section title="Produtos mais vistos">
        <Table
          headers={['Produto', 'Visualizações']}
          rows={topViewed.map((p) => [p.title, String(p.count)])}
          empty="Sem visualizações registradas nesse período."
        />
      </Section>

      <Section title='Cliques em "Comprar" por produto'>
        <Table
          headers={['Produto', 'Cliques']}
          rows={topClicks.map((p) => [p.title, String(p.count)])}
          empty="Sem cliques registrados nesse período."
        />
      </Section>

      <Section title="Origem do tráfego">
        <Table
          headers={['Origem', 'Visitas']}
          rows={sources.map(([origem, count]) => [origem, String(count)])}
          empty="Sem dados de origem nesse período."
        />
      </Section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#E7E7E5] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B58A2E]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#111]">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#111]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Table({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) {
    return <p className="rounded border border-dashed border-[#E7E7E5] bg-white p-6 text-sm text-[#6B6B6B]">{empty}</p>
  }
  return (
    <div className="overflow-hidden rounded border border-[#E7E7E5] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#FAF8F3] text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#E7E7E5]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[#111]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
