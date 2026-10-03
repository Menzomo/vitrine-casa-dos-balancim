import { createClient } from '@/lib/supabase/server'
import { toggleProductHidden, setFeatured } from '../actions'

type ProductRow = {
  id: string
  ml_item_id: string
  title: string
  status: string
  stock: number
  hidden: boolean
  brand: string | null
}

type FeaturedRow = { product_id: string; position: number }

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const [productsRes, featuredRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, ml_item_id, title, status, stock, hidden, brand')
      .order('title'),
    supabase.from('featured_products').select('product_id, position'),
  ])

  const products = (productsRes.data ?? []) as ProductRow[]
  const featuredMap = new Map(((featuredRes.data ?? []) as FeaturedRow[]).map((f) => [f.product_id, f.position]))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Produtos</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#6B6B6B]">
          Ocultar um produto some ele da vitrine mesmo que esteja ativo no Mercado Livre. Marcar como destaque coloca o
          produto na seção &quot;Destaques&quot; da home, na ordem definida abaixo (menor número aparece primeiro).
        </p>
      </div>

      <div className="overflow-hidden rounded border border-[#E7E7E5] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF8F3] text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Status ML</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Visível na vitrine</th>
              <th className="px-4 py-3">Destaque</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isFeatured = featuredMap.has(product.id)
              const position = featuredMap.get(product.id) ?? 0
              return (
                <tr key={product.id} className="border-t border-[#E7E7E5]">
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-medium text-[#111]">{product.title}</p>
                    <p className="text-xs text-[#6B6B6B]">{product.brand ?? 'Sem marca'}</p>
                  </td>
                  <td className="px-4 py-3 text-[#111]">{product.status}</td>
                  <td className="px-4 py-3 text-[#111]">{product.stock}</td>
                  <td className="px-4 py-3">
                    <form action={toggleProductHidden.bind(null, product.id, !product.hidden)}>
                      <button
                        type="submit"
                        className={`rounded px-3 py-1.5 text-xs font-semibold ${product.hidden ? 'bg-[#FAF8F3] text-[#6B6B6B]' : 'bg-[#B58A2E]/10 text-[#B58A2E]'}`}
                      >
                        {product.hidden ? 'Oculto — mostrar' : 'Visível — ocultar'}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={setFeatured} className="flex items-center gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <label className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                        <input type="checkbox" name="featured" defaultChecked={isFeatured} className="size-4 accent-[#B58A2E]" />
                        Destaque
                      </label>
                      <input
                        type="number"
                        name="position"
                        defaultValue={position}
                        className="h-8 w-16 rounded border border-[#E7E7E5] px-2 text-xs"
                        aria-label="Posição no destaque"
                      />
                      <button type="submit" className="rounded border border-[#E7E7E5] px-2 py-1 text-xs font-medium text-[#111] hover:border-[#B58A2E]">
                        Salvar
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
