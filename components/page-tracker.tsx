'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Dispara um evento pro /api/track depois que a página carrega. Fica no
// layout raiz (pageview, roda a cada navegação — usePathname muda a cada
// rota, mesmo sem reload completo) e também, com productId, na página de
// produto (product_view). Não lê nenhum dado pessoal, só UTM/path/sessão
// anônima — ver lib/analytics/session.ts.
export function PageTracker({ type, productId }: { type: 'pageview' | 'product_view'; productId?: string }) {
  const pathname = usePathname()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        type,
        productId,
        path: window.location.pathname,
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_term: params.get('utm_term'),
        utm_content: params.get('utm_content'),
      }),
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}
