import { createClient } from '@/lib/supabase/server'

type VisitsByDay = { day: string; visits: number }
type ProductCount = { ml_item_id: string; title: string; views?: number; clicks?: number }
type TrafficSource = { origem: string; eventos: number }

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [visitsRes, topViewedRes, topClicksRes, sourcesRes] = await Promise.all([
    supabase.from('v_visits_by_day').select('*').limit(30),
    supabase.from('v_top_viewed_products').select('*').limit(10),
    supabase.from('v_buy_clicks_by_product').select('*').limit(10),
    supabase.from('v_traffic_sources').select('*'),
  ])

  const visits = (visitsRes.data ?? []) as VisitsByDay[]
  const topViewed = (topViewedRes.data ?? []) as ProductCount[]
  const topClicks = (topClicksRes.data ?? []) as ProductCount[]
  const sources = (sourcesRes.data ?? []) as TrafficSource[]

  const totalVisits = visits.reduce((sum, v) => sum + v.visits, 0)
  const totalClicks = topClicks.reduce((sum, c) => sum + (c.clicks ?? 0), 0)

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Métricas</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#6B6B6B]">
          Medimos visitas ao site e cliques em &quot;Comprar&quot; que saíram pro Mercado Livre — isso mostra interesse, não
          a venda concluída. O Mercado Livre não nos informa quais cliques viraram pedido.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Visitas (últimos 30 dias)" value={totalVisits} />
        <StatCard label="Produtos com visualização" value={topViewed.length} />
        <StatCard label="Cliques em Comprar" value={totalClicks} />
      </div>

      <Section title="Visitas por dia">
        <Table
          headers={['Dia', 'Visitas']}
          rows={visits.map((v) => [new Date(v.day).toLocaleDateString('pt-BR'), String(v.visits)])}
          empty="Sem visitas registradas ainda."
        />
      </Section>

      <Section title="Produtos mais vistos">
        <Table
          headers={['Produto', 'Visualizações']}
          rows={topViewed.map((p) => [p.title, String(p.views ?? 0)])}
          empty="Sem visualizações registradas ainda."
        />
      </Section>

      <Section title='Cliques em "Comprar" por produto'>
        <Table
          headers={['Produto', 'Cliques']}
          rows={topClicks.map((p) => [p.title, String(p.clicks ?? 0)])}
          empty="Sem cliques registrados ainda."
        />
      </Section>

      <Section title="Origem do tráfego">
        <Table
          headers={['Origem', 'Visitas']}
          rows={sources.map((s) => [s.origem, String(s.eventos)])}
          empty="Sem dados de origem ainda."
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
