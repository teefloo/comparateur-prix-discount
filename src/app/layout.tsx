import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Agentation } from 'agentation'

import { ThemeProvider } from '@/components/ThemeProvider'
import { absoluteUrl, getSiteUrl } from '@/lib/site'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'ComparPrix',
    template: '%s | ComparPrix',
  },
  description:
    "Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi et La Foir'Fouille. Comparez des offres mises à jour régulièrement et trouvez le meilleur prix plus vite.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ComparPrix',
    description:
      "Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi et La Foir'Fouille.",
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
      "Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi et La Foir'Fouille.",
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3 dark:text-slate-100">
                      <span className="text-accent">Compar</span>Prix
                    </h3>
                    <p className="text-muted text-sm max-w-sm leading-relaxed dark:text-slate-400">
                      Le comparateur intelligent pour vos enseignes de discount préférées. Mise à jour hebdomadaire pour des économies maximales.
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="flex gap-6 md:justify-end text-sm text-muted dark:text-slate-300">
                      <a href="/" className="hover:text-accent transition-colors">Accueil</a>
                      <a href="/a-propos" className="hover:text-accent transition-colors">À propos</a>
                      <a href="mailto:contact@comparprix.fr" className="hover:text-accent transition-colors">Contact</a>
                    </div>
                    <p className="text-subtle text-xs mt-4 dark:text-slate-400">
                      Les prix sont indicatifs et peuvent varier selon les magasins.
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-200 mt-10 pt-6 text-center text-subtle text-xs dark:border-slate-800 dark:text-slate-400">
                  &copy; {new Date().getFullYear()} ComparPrix. Fait avec passion pour votre pouvoir d&apos;achat.
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' ? <Agentation /> : null}
      </body>
    </html>
  )
}
