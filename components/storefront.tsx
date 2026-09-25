'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Search, MessageCircle, ChevronRight, SlidersHorizontal, ArrowUpDown, Check, Truck, ShieldCheck, Wrench, X, Menu, PackageSearch } from 'lucide-react'
import { Product, Category } from '@/lib/products'

const categoryLabels: Record<Category, string> = {
  roletado: 'Roletado', admissao: 'Admissão', escape: 'Escape', conjunto: 'Conjunto eixo + balancins',
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5" aria-label="Casa dos Balancim - início">
    <svg aria-hidden="true" viewBox="0 0 42 36" className="size-10 shrink-0 text-[#B58A2E]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 28 21 13l17 15M10 23V15l11-9 11 9v13M21 6v22M21 18h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {!compact && <span className="font-[var(--font-poppins)] text-[15px] font-semibold leading-tight text-[#111]">Casa dos<br className="sm:hidden" /> balancim</span>}
  </Link>
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  return <header className="sticky top-0 z-40 border-b border-[#E7E7E5] bg-white/95 backdrop-blur-sm">
    <div className="container flex h-[72px] items-center justify-between gap-4">
      <Logo />
      <form action="/produtos" className="hidden max-w-[460px] flex-1 md:flex" role="search">
        <div className="relative w-full">
          <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6B6B6B]" />
          <input name="q" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 w-full rounded border border-[#E7E7E5] bg-[#FAF8F3] pl-11 pr-4 text-sm text-[#111] outline-none transition placeholder:text-[#6B6B6B] focus:border-[#B58A2E] focus:ring-2 focus:ring-[#D4B05A]/30" placeholder="Busque por motor, aplicação ou modelo do veículo" aria-label="Buscar produtos" />
        </div>
      </form>
      <div className="flex items-center gap-3">
        <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-sm font-medium text-[#111] transition hover:text-[#B58A2E] sm:flex"><MessageCircle aria-hidden="true" className="size-5 text-[#B58A2E]" /> WhatsApp</a>
        <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded p-2 text-[#111] hover:bg-[#FAF8F3] md:hidden" aria-expanded={menuOpen} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </div>
    {menuOpen && <div className="border-t border-[#E7E7E5] bg-white p-4 md:hidden">
      <form action="/produtos" className="relative mb-3"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B6B6B]" /><input name="q" className="h-11 w-full rounded border border-[#E7E7E5] bg-[#FAF8F3] pl-10 pr-3 text-sm" placeholder="Buscar produtos" /></form>
      <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 text-sm font-medium"><MessageCircle className="size-5 text-[#B58A2E]" /> Fale pelo WhatsApp</a>
    </div>}
  </header>
}

export function Footer() {
  return <footer className="border-t border-[#E7E7E5] bg-[#FAF8F3]">
    <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1"><Logo /><p className="mt-5 max-w-xs text-sm leading-relaxed text-[#6B6B6B]">Peças para quem entende de motor. Especialistas em balancins de válvula para veículos leves e pesados.</p></div>
      <div><h3 className="font-[var(--font-poppins)] text-sm font-semibold text-[#111]">Navegação</h3><nav className="mt-4 flex flex-col gap-3 text-sm text-[#6B6B6B]"><Link href="/produtos" className="hover:text-[#B58A2E]">Todos os produtos</Link><Link href="/produtos?categoria=roletado" className="hover:text-[#B58A2E]">Balancins roletados</Link><Link href="/produtos?categoria=admissao" className="hover:text-[#B58A2E]">Admissão e escape</Link><Link href="/produtos?categoria=conjunto" className="hover:text-[#B58A2E]">Conjuntos</Link></nav></div>
      <div><h3 className="font-[var(--font-poppins)] text-sm font-semibold text-[#111]">Atendimento</h3><div className="mt-4 flex flex-col gap-3 text-sm text-[#6B6B6B]"><span>Seg a sex, das 8h às 18h</span><a href="https://wa.me/5500000000000" className="hover:text-[#B58A2E]">(00) 00000-0000</a><a href="mailto:contato@casadosbalancim.com.br" className="hover:text-[#B58A2E]">contato@casadosbalancim.com.br</a></div></div>
      <div><h3 className="font-[var(--font-poppins)] text-sm font-semibold text-[#111]">Siga a gente</h3><a href="https://instagram.com/casadosbalancim" target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-[#6B6B6B] hover:text-[#B58A2E]">@casadosbalancim</a><p className="mt-5 text-xs leading-relaxed text-[#6B6B6B]">Envio para todo o Brasil com segurança e rastreio.</p></div>
    </div>
    <div className="border-t border-[#E7E7E5] py-5"><div className="container flex flex-col gap-2 text-xs text-[#6B6B6B] sm:flex-row sm:items-center sm:justify-between"><span>© 2025 Casa dos Balancim. Todos os direitos reservados.</span><span>Catálogo demonstrativo</span></div></div>
  </footer>
}

export function ProductCard({ product }: { product: Product }) {
  const productHref = `/produtos/${product.id}`
  return <article className="group flex h-full flex-col overflow-hidden rounded border border-[#E7E7E5] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D4B05A] hover:shadow-lg hover:shadow-[#B58A2E]/10">
    <Link href={productHref} className="relative block aspect-square overflow-hidden bg-[#FAF8F3]" aria-label={`Ver ${product.title}`}>
      <Image src={product.images[0]} alt="Imagem ilustrativa do produto" fill className="object-cover p-7 transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
      {product.stock > 0 && product.stock <= 3 && <span className="absolute left-3 top-3 rounded bg-[#B58A2E] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Últimas unidades</span>}
    </Link>
    <div className="flex flex-1 flex-col p-4 sm:p-5"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B58A2E]">{product.category ? categoryLabels[product.category] : 'Balancim'} · {product.brand ?? 'Marca não informada'}</span><Link href={productHref} className="mt-2 line-clamp-3 text-sm font-semibold leading-snug text-[#111] transition hover:text-[#B58A2E] sm:text-[15px]">{product.title}</Link><div className="mt-auto pt-5"><p className="text-lg font-bold text-[#111]">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p><p className="mt-1 text-xs text-[#6B6B6B]">à vista no catálogo</p><a href={`/go/${product.id}`} target="_blank" rel="noopener" className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded bg-[#B58A2E] text-sm font-semibold text-white transition hover:bg-[#8e6b20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A2E] focus-visible:ring-offset-2">Comprar <ChevronRight aria-hidden="true" className="size-4" /></a></div></div>
  </article>
}

export function TrustBar() {
  const items = [[Wrench, 'Especialistas em balancim', 'Conhecimento que faz diferença'], [Truck, 'Envio para todo o Brasil', 'Embalagem segura e rastreio'], [ShieldCheck, 'Procedência garantida', 'Peças selecionadas e confiáveis']]
  return <section className="border-y border-[#E7E7E5] bg-[#FAF8F3]"><div className="container grid divide-y divide-[#E7E7E5] md:grid-cols-3 md:divide-x md:divide-y-0">{items.map(([Icon, title, desc]) => <div key={title as string} className="flex items-center gap-4 py-6 md:px-8 first:md:pl-0 last:md:pr-0"><div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#D4B05A]/20 text-[#B58A2E]"><Icon aria-hidden="true" className="size-5" /></div><div><p className="text-sm font-semibold text-[#111]">{title as string}</p><p className="mt-1 text-xs text-[#6B6B6B]">{desc as string}</p></div></div>)}</div></section>
}

export function FilterPanel({ brands, selectedBrand, selectedCategory, inStock, onBrand, onCategory, onStock }: { brands: string[]; selectedBrand: string; selectedCategory: string; inStock: boolean; onBrand: (v: string) => void; onCategory: (v: string) => void; onStock: (v: boolean) => void }) {
  return <div className="flex flex-col gap-6"><div><h3 className="text-sm font-semibold text-[#111]">Montadora</h3><div className="mt-3 flex flex-col gap-2">{brands.map(brand => <label key={brand} className="flex cursor-pointer items-center gap-3 text-sm text-[#6B6B6B]"><input type="radio" name="brand" checked={selectedBrand === brand} onChange={() => onBrand(selectedBrand === brand ? '' : brand)} className="size-4 accent-[#B58A2E]" />{brand}</label>)}</div></div><div><h3 className="text-sm font-semibold text-[#111]">Tipo de peça</h3><div className="mt-3 flex flex-col gap-2">{Object.entries(categoryLabels).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-3 text-sm text-[#6B6B6B]"><input type="radio" name="category" checked={selectedCategory === key} onChange={() => onCategory(selectedCategory === key ? '' : key)} className="size-4 accent-[#B58A2E]" />{label}</label>)}</div></div><label className="flex cursor-pointer items-center gap-3 border-t border-[#E7E7E5] pt-5 text-sm font-medium text-[#111]"><input type="checkbox" checked={inStock} onChange={(e) => onStock(e.target.checked)} className="size-4 accent-[#B58A2E]" /> Apenas em estoque</label></div>
}

export function FilterButton({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="flex items-center gap-2 rounded border border-[#E7E7E5] px-4 py-2.5 text-sm font-medium text-[#111] hover:border-[#B58A2E] md:hidden"><SlidersHorizontal className="size-4 text-[#B58A2E]" /> Filtros</button> }
export { categoryLabels }
export { Search, PackageSearch, ArrowUpDown, Check }
