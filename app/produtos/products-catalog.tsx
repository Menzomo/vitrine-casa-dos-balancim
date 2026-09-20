'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpDown, ChevronRight, Menu, Search, X } from 'lucide-react'
import { Product } from '@/lib/products'
import { FilterPanel, Footer, Header, ProductCard } from '@/components/storefront'

export function ProductsCatalog({ initialProducts, initialSearch, initialBrand, initialCategory }: { initialProducts: Product[]; initialSearch: string; initialBrand: string; initialCategory: string }) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState(initialSearch)
  const [brand, setBrand] = useState(initialBrand)
  const [category, setCategory] = useState(initialCategory)
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState('relevancia')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = products.filter(p => (!brand || p.brand === brand) && (!category || p.category === category) && (!inStock || p.stock > 0))
    if (sort === 'menor') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'maior') result = [...result].sort((a, b) => b.price - a.price)
    return result
  }, [products, inStock, sort])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const query = search.toLowerCase()
    setProducts(initialProducts.filter(p => !query || p.title.toLowerCase().includes(query) || p.engine.toLowerCase().includes(query) || p.applications.some(a => a.vehicle.toLowerCase().includes(query))))
  }
  function clearFilters() { setBrand(''); setCategory(''); setInStock(false); setSearch(''); setProducts(initialProducts) }
  return <div className="min-h-screen bg-white"><Header /><main className="container py-10 sm:py-14"><div className="mb-8 flex items-center gap-2 text-xs text-[#6B6B6B]"><Link href="/" className="hover:text-[#B58A2E]">Início</Link><ChevronRight className="size-3" /><span className="text-[#111]">Catálogo</span></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B58A2E]">Peças selecionadas</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111] sm:text-4xl">Catálogo de balancins</h1><p className="mt-3 text-sm text-[#6B6B6B]">Encontre a peça certa para o seu motor.</p></div><span className="text-sm text-[#6B6B6B]">{filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</span></div><div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-start"><aside className="hidden w-56 shrink-0 rounded border border-[#E7E7E5] p-5 lg:block"><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold text-[#111]">Filtros</h2><button type="button" onClick={clearFilters} className="text-xs text-[#B58A2E] hover:underline">Limpar</button></div><FilterPanel selectedBrand={brand} selectedCategory={category} inStock={inStock} onBrand={setBrand} onCategory={setCategory} onStock={setInStock} /></aside><div className="min-w-0 flex-1"><div className="flex flex-col gap-3 sm:flex-row"><form onSubmit={handleSearch} className="relative flex flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B6B6B]" /><input value={search} onChange={e => setSearch(e.target.value)} className="h-11 w-full rounded border border-[#E7E7E5] bg-[#FAF8F3] pl-10 pr-4 text-sm outline-none focus:border-[#B58A2E]" placeholder="Buscar por veículo, motor ou aplicação" /><button className="sr-only">Buscar</button></form><div className="flex gap-3"><button type="button" onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 rounded border border-[#E7E7E5] px-4 text-sm font-medium lg:hidden"><Menu className="size-4 text-[#B58A2E]" /> Filtros</button><label className="flex h-11 items-center gap-2 rounded border border-[#E7E7E5] px-3 text-sm text-[#6B6B6B]"><ArrowUpDown className="size-4 text-[#B58A2E]" /><span className="hidden sm:inline">Ordenar:</span><select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent font-medium text-[#111] outline-none"><option value="relevancia">Relevância</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option></select></label></div></div>{filtered.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-6 rounded border border-dashed border-[#D4B05A] bg-[#FAF8F3] px-6 py-16 text-center"><Search className="mx-auto size-8 text-[#B58A2E]" /><h2 className="mt-4 text-lg font-semibold text-[#111]">Nenhum produto encontrado</h2><p className="mx-auto mt-2 max-w-sm text-sm text-[#6B6B6B]">Tente buscar por outro veículo ou limpe os filtros para ver todo o catálogo.</p><button type="button" onClick={clearFilters} className="mt-5 text-sm font-semibold text-[#B58A2E] hover:underline">Limpar filtros</button></div>}</div></div></main>{filtersOpen && <div className="fixed inset-0 z-50 bg-[#111]/30 lg:hidden" onClick={() => setFiltersOpen(false)}><div className="ml-auto h-full w-[min(340px,90vw)] overflow-y-auto bg-white p-6" onClick={e => e.stopPropagation()}><div className="mb-7 flex items-center justify-between"><h2 className="font-[var(--font-poppins)] text-lg font-semibold">Filtros</h2><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fechar filtros"><X /></button></div><FilterPanel selectedBrand={brand} selectedCategory={category} inStock={inStock} onBrand={setBrand} onCategory={setCategory} onStock={setInStock} /><button type="button" onClick={() => setFiltersOpen(false)} className="mt-8 h-11 w-full rounded bg-[#B58A2E] text-sm font-semibold text-white">Ver produtos</button></div></div>}<Footer /></div>
}
