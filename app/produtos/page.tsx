import { Metadata } from 'next'
import { getBrands, getProducts } from '@/lib/products'
import { getSettings } from '@/lib/settings'
import { ProductsCatalog } from './products-catalog'

export const metadata: Metadata = {
  title: 'Catálogo de Balancins',
  description: 'Encontre balancins de válvula por montadora, tipo, aplicação ou motor.',
  alternates: { canonical: '/produtos' },
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; montadora?: string; categoria?: string }> }) {
  const params = await searchParams
  const [allProducts, brands, settings] = await Promise.all([
    getProducts({ search: params.q, brand: params.montadora, category: params.categoria as any }),
    getBrands(),
    getSettings(),
  ])
  return <ProductsCatalog initialProducts={allProducts} brands={brands} settings={settings} initialSearch={params.q || ''} initialBrand={params.montadora || ''} initialCategory={params.categoria || ''} />
}
