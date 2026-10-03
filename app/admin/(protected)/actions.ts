'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Todas as ações aqui rodam com a sessão do usuário logado (não o client
// admin/service role) — a RLS de products/banners/featured_products/
// site_settings já exige is_admin() pra escrever, então mesmo que alguém
// chame essas actions por fora da UI, sem ser admin a escrita é rejeitada.

export async function toggleProductHidden(productId: string, hidden: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ hidden }).eq('id', productId)
  if (error) console.error('toggleProductHidden falhou:', error.message)
  revalidatePath('/admin/produtos')
  revalidatePath('/')
  revalidatePath('/produtos')
}

export async function setFeatured(formData: FormData) {
  const productId = String(formData.get('productId'))
  const featured = formData.get('featured') === 'on'
  const position = Number(formData.get('position') ?? 0)

  const supabase = await createClient()
  if (featured) {
    const { error } = await supabase.from('featured_products').upsert({ product_id: productId, position }, { onConflict: 'product_id' })
    if (error) console.error('setFeatured (upsert) falhou:', error.message)
  } else {
    const { error } = await supabase.from('featured_products').delete().eq('product_id', productId)
    if (error) console.error('setFeatured (delete) falhou:', error.message)
  }
  revalidatePath('/admin/produtos')
  revalidatePath('/')
}

export async function createBanner(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('banners').insert({
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? '') || null,
    link_url: String(formData.get('link_url') ?? '') || null,
    image_url: String(formData.get('image_url') ?? '') || null,
    position: Number(formData.get('position') ?? 0),
  })
  if (error) console.error('createBanner falhou:', error.message)
  revalidatePath('/admin/banners')
  revalidatePath('/')
}

export async function toggleBannerActive(bannerId: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('banners').update({ active }).eq('id', bannerId)
  if (error) console.error('toggleBannerActive falhou:', error.message)
  revalidatePath('/admin/banners')
  revalidatePath('/')
}

export async function deleteBanner(bannerId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('banners').delete().eq('id', bannerId)
  if (error) console.error('deleteBanner falhou:', error.message)
  revalidatePath('/admin/banners')
  revalidatePath('/')
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  const entries = [
    { key: 'whatsapp_number', value: String(formData.get('whatsapp_number') ?? '').replace(/\D/g, '') },
    { key: 'business_hours', value: String(formData.get('business_hours') ?? '') },
    { key: 'footer_about', value: String(formData.get('footer_about') ?? '') },
  ]
  const { error } = await supabase.from('site_settings').upsert(entries, { onConflict: 'key' })
  if (error) console.error('updateSettings falhou:', error.message)
  revalidatePath('/admin/configuracoes')
  revalidatePath('/')
  revalidatePath('/produtos')
}
