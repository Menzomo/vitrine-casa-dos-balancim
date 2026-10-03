import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Permissivo de propósito: o objetivo do site é ser encontrado, inclusive
// por engines de IA (GPTBot, ClaudeBot, PerplexityBot etc. já caem no "*").
// Só a área administrativa e as rotas internas ficam de fora.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/go/', '/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
