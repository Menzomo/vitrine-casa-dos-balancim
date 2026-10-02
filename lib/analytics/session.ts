import 'server-only'
import type { cookies } from 'next/headers'

export const SESSION_COOKIE = 'cb_sid'
const SESSION_MAX_AGE = 60 * 60 * 24 * 180 // 180 dias

// Sessão anônima (sem dado pessoal) usada pra agrupar os eventos de um
// mesmo visitante — pageview, product_view, buy_click. Reaproveita o
// cookie se já existir; cria um novo (e grava) se for a primeira visita.
export async function getOrCreateSessionId(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<string> {
  const existing = cookieStore.get(SESSION_COOKIE)?.value
  if (existing) return existing

  const sessionId = crypto.randomUUID()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  return sessionId
}
