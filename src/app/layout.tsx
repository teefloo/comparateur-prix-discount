import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ArrowUpRight } from 'lucide-react'

import AgentationDev from '@/components/AgentationDev'
import Logo from '@/components/Logo'
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
            <AgentationDev />
            <footer className="bg-paper/90 dark:bg-slate-950/70">
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
                <div className="rounded-2xl bg-white/80 p-5 shadow-card backdrop-blur-sm dark:bg-slate-900/80 sm:p-6">
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-lg space-y-4">
                      <Logo />
                      <p className="text-sm leading-relaxed text-muted dark:text-slate-300">
                        Comparez plus vite les prix discount et gardez l&apos;essentiel sous les yeux, sans bruit ni détour.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-muted dark:text-slate-400">
                        <span className="rounded-full bg-paper px-3 py-1.5 dark:bg-slate-950/70">
                          10 enseignes suivies
                        </span>
                        <span className="rounded-full bg-paper px-3 py-1.5 dark:bg-slate-950/70">
                          Recherche produit
                        </span>
                        <span className="rounded-full bg-paper px-3 py-1.5 dark:bg-slate-950/70">
                          Bons plans centralises
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-[minmax(0,12rem)_minmax(0,15rem)]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-subtle dark:text-slate-500">
                          Navigation
                        </p>
                        <div className="mt-4 flex flex-col gap-3 text-sm text-muted dark:text-slate-300">
                          <Link href="/" className="transition-colors hover:text-foreground dark:hover:text-slate-100">
                            Accueil
                          </Link>
                          <Link href="/deals" className="transition-colors hover:text-foreground dark:hover:text-slate-100">
                            Bons plans
                          </Link>
                          <Link href="/a-propos" className="transition-colors hover:text-foreground dark:hover:text-slate-100">
                            A propos
                          </Link>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-subtle dark:text-slate-500">
                          Projet
                        </p>
                        <a
                          href="https://github.com/teefloo/comparateur-prix-discount"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white dark:bg-slate-950/70 dark:text-slate-100 dark:hover:bg-slate-900"
                        >
                          <span>GitHub</span>
                          <ArrowUpRight size={16} className="text-subtle dark:text-slate-500" />
                        </a>
                        <p className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-400">
                          Le code source et le suivi du projet sont disponibles sur le depot public.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 pt-4 text-xs text-subtle dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>Les prix affiches dependent du stock, des enseignes et du moment de releve.</span>
                    <span>ComparPrix</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
