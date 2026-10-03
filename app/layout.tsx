import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { PageTracker } from '@/components/page-tracker'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { getSettings } from '@/lib/settings'
import './globals.css'

const DESCRIPTION =
  'Especialistas em balancins de válvula roletados, admissão e escape. Peças de procedência com garantia para GM, Renault, MWM, Mitsubishi, Mercedes-Benz, Audi, Fiat, Volkswagen, Suzuki e Ford.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Balancins de Válvula Especializados`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  generator: 'v0.app',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Balancins de Válvula Especializados`,
    description: DESCRIPTION,
    url: SITE_URL,
    images: ['/logo-casados-balancim.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Balancins de Válvula Especializados`,
    description: DESCRIPTION,
    images: ['/logo-casados-balancim.png'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [{ color: '#B58A2E' }],
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSettings()

  // JSON-LD da loja em si — ajuda tanto buscadores tradicionais quanto
  // engines de IA (GEO) a entenderem quem é o negócio sem precisar
  // "adivinhar" a partir do texto solto da página.
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    name: SITE_NAME,
    description: DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/logo-casados-balancim.png`,
    telephone: `+${settings.whatsapp_number}`,
    sameAs: ['https://instagram.com/casadosbalancim'],
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-poppins: 'Poppins', sans-serif;
                --font-inter: 'Inter', sans-serif;
              }
            `,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && <PageTracker type="pageview" />}
      </body>
    </html>
  )
}
