import { createPublicClient } from './supabase/public'

export interface Banner {
  id: string
  title: string
  description: string | null
  linkUrl: string | null
  imageUrl: string | null
  position: number
}

export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('banners')
    .select('id, title, description, link_url, image_url, position')
    .eq('active', true)
    .order('position', { ascending: true })

  if (error) {
    console.error('Falha ao buscar banners:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    linkUrl: row.link_url,
    imageUrl: row.image_url,
    position: row.position,
  }))
}
