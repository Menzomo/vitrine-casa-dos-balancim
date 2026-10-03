import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { getProducts } from '@/lib/products'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts()

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/produtos`, changeFrequency: 'daily', priority: 0.9 },
    ...products.map((product) => ({
      url: `${SITE_URL}/produtos/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
