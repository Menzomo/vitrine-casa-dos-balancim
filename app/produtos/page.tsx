import { Metadata } from 'next'
import { getProducts } from '@/lib/products'
import { ProductsCatalog } from './products-catalog'

export const metadata: Metadata = { title: 'Catálogo de Balancins | Casa dos Balancim', description: 'Encontre balancins de válvula por montadora, tipo, aplicação ou motor.' }

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; montadora?: string; categoria?: string }> }) {
  const params = await searchParams
  const allProducts = getProducts({ search: params.q, brand: params.montadora, category: params.categoria as any })
  return <ProductsCatalog initialProducts={allProducts} initialSearch={params.q || ''} initialBrand={params.montadora || ''} initialCategory={params.categoria || ''} />
}
