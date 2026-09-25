import { createPublicClient } from './supabase/public'

export type Category = 'roletado' | 'admissao' | 'escape' | 'conjunto'

export interface Application {
  vehicle: string
  years: string
  engine: string
}

export interface Spec {
  label: string
  value: string
}

// Atributos do ML que não interessam mostrar pro comprador (campos
// internos de catálogo/embalagem) — o próprio site do ML também não
// exibe esses na tela de características do produto.
const HIDDEN_ATTRIBUTE_IDS = new Set([
  'CATALOG_TITLE',
  'GTIN',
  'HAS_COMPATIBILITIES',
  'PRODUCT_DATA_SOURCE',
  'SELLER_PACKAGE_HEIGHT',
  'SELLER_PACKAGE_LENGTH',
  'SELLER_PACKAGE_WIDTH',
  'SELLER_PACKAGE_WEIGHT',
])

export interface Product {
  id: string
  title: string
  price: number
  stock: number
  status: string
  images: string[]
  permalink: string
  // category/brand/engine ainda podem ser null: não são campos nativos do
  // Mercado Livre, dependem de classificação (automática ou manual) que
  // ainda está sendo construída.
  category: Category | null
  brand: string | null
  engine: string | null
  applications: Application[]
  description: string | null
  // Demais características do anúncio no ML (tipo de balancim, origem,
  // auto-compensador, etc.) — varia de item pra item, mostra só o que existir.
  specs: Spec[]
  createdAt: Date
  updatedAt: Date
}

type MlAttribute = { id: string; name?: string; value_name?: string | null }

type ProductRow = {
  ml_item_id: string
  title: string
  price: number
  stock: number
  status: string
  images: string[] | null
  permalink: string
  category: string | null
  brand: string | null
  engine: string | null
  applications: Application[] | null
  description: string | null
  ml_attributes: { attributes?: MlAttribute[] } | null
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  'ml_item_id, title, price, stock, status, images, permalink, category, brand, engine, applications, description, ml_attributes, created_at, updated_at'

function mapSpecs(attributes: MlAttribute[] | undefined): Spec[] {
  if (!attributes) return []
  return attributes
    .filter((attr) => attr.name && attr.value_name && !HIDDEN_ATTRIBUTE_IDS.has(attr.id))
    .map((attr) => ({ label: attr.name!, value: attr.value_name! }))
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.ml_item_id,
    title: row.title,
    price: Number(row.price),
    stock: row.stock,
    status: row.status,
    images: row.images ?? [],
    permalink: row.permalink,
    category: (row.category as Category | null) ?? null,
    brand: row.brand,
    engine: row.engine,
    applications: row.applications ?? [],
    description: row.description,
    specs: mapSpecs(row.ml_attributes?.attributes),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

// RLS do Supabase já restringe o que o client público enxerga (status
// active, estoque > 0, não oculto). Os filtros abaixo ficam explícitos
// mesmo assim, por clareza — a RLS é quem garante isso de verdade.
export async function getProducts(filters?: {
  brand?: string
  category?: Category
  search?: string
  inStock?: boolean
}): Promise<Product[]> {
  const supabase = createPublicClient()
  let query = supabase.from('products').select(SELECT_COLUMNS)

  if (filters?.brand) query = query.eq('brand', filters.brand)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.inStock) query = query.gt('stock', 0)
  if (filters?.search) {
    const term = filters.search.replace(/[%,]/g, ' ').trim()
    if (term) query = query.or(`title.ilike.%${term}%,engine.ilike.%${term}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(`Falha ao buscar produtos: ${error.message}`)
  return (data ?? []).map(mapRow)
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_COLUMNS)
    .eq('ml_item_id', id)
    .maybeSingle()

  if (error) throw new Error(`Falha ao buscar produto ${id}: ${error.message}`)
  return data ? mapRow(data) : null
}

export async function getBrands(): Promise<string[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null)

  if (error) throw new Error(`Falha ao buscar marcas: ${error.message}`)
  const unique = new Set((data ?? []).map((row) => row.brand as string))
  return [...unique].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function getCategories(): Category[] {
  return ['roletado', 'admissao', 'escape', 'conjunto']
}

export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  const product = await getProductById(productId)
  if (!product || !product.brand) return []

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_COLUMNS)
    .eq('brand', product.brand)
    .neq('ml_item_id', productId)
    .limit(limit)

  if (error) throw new Error(`Falha ao buscar produtos relacionados: ${error.message}`)
  return (data ?? []).map(mapRow)
}

export async function searchProducts(query: string): Promise<Product[]> {
  return getProducts({ search: query })
}
