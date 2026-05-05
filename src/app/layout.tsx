import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'

import { ThemeProvider } from '@/components/ThemeProvider'
import { absoluteUrl, getSiteUrl } from '@/lib/site'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'ComparPrix',
    template: '%s | ComparPrix',
  },
  description:
    "Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ComparPrix',
    description:
      "Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
    type: 'website',
    locale: 'fr_FR',
    url: absoluteUrl('/'),
    siteName: 'ComparPrix',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'ComparPrix',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComparPrix',
    description:
      "Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col overflow-x-clip">
            <div className="flex-1 min-w-0 pb-28 md:pb-0">{children}</div>
            <footer className="border-t border-line bg-paper/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-md">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted dark:text-slate-400">
                      ComparPrix
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-300">
                      Comparateur de prix discount pour repérer vite les meilleures offres, sans bruit visuel ni friction inutile.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted dark:text-slate-300">
                    <a href="/" className="transition-colors hover:text-foreground dark:hover:text-slate-100">
                      Accueil
                    </a>
                    <a href="/deals" className="transition-colors hover:text-foreground dark:hover:text-slate-100">
                      Bons plans
                    </a>
                    <a href="/a-propos" className="transition-colors hover:text-foreground dark:hover:text-slate-100">
                      À propos
                    </a>
                    <a href="mailto:contact@comparprix.fr" className="transition-colors hover:text-foreground dark:hover:text-slate-100">
                      Contact
                    </a>
                  </div>
                </div>
                <div className="mt-6 border-t border-line pt-4 text-xs text-subtle dark:border-slate-800 dark:text-slate-500">
                  Les prix affichés dépendent du stock, des enseignes et du moment de relevé.
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
