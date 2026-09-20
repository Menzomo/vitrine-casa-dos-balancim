import { NextResponse } from 'next/server'
import { getProductById } from '@/lib/products'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const product = getProductById((await params).id)
  if (!product) return NextResponse.redirect(new URL('/produtos', _request.url))
  return NextResponse.redirect(new URL(product.permalink, _request.url))
}
