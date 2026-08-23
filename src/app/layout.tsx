import type { Metadata } from 'next'
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import { ArrowUpRight } from 'lucide-react'

import Logo from '@/components/Logo'
import ReopenCookieBannerButton from '@/components/ReopenCookieBannerButton'
import CookieConsentLazy from '@/components/CookieConsentLazy'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LEGAL_PAGES, LEGAL_INFO } from '@/lib/legal'
import { absoluteUrl, getSiteUrl } from '@/lib/site'

import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

const socialImage = {
  url: '/brand/comparprix-social.svg',
  width: 1200,
  height: 630,
  alt: 'ComparPrix, comparateur de prix discount',
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'ComparPrix | Le comparateur de prix discount',
    template: '%s | ComparPrix',
  },
  description:
    "Le comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ComparPrix | Le comparateur de prix discount',
    description:
      "Comparez les prix de 10 enseignes discount et repérez rapidement l'offre la plus intéressante.",
    type: 'website',
    locale: 'fr_FR',
    url: absoluteUrl('/'),
    siteName: 'ComparPrix',
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComparPrix | Le comparateur de prix discount',
    description:
      "Comparez les prix de 10 enseignes discount et repérez rapidement l'offre la plus intéressante.",
    images: ['/brand/comparprix-social.svg'],
  },
  verification: {
    google: 'v5m0to6YetyRtZUXoz1CQYhGU2hCaaOVTHj-d-npAYo',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/brand/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="" />
        <link rel="preconnect" href="https://asset.action.com" crossOrigin="" />
        <link rel="preconnect" href="https://s7g10.scene7.com" crossOrigin="" />
        <link rel="preconnect" href="https://imgproxy-retcat.assets.schwarz" crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.gifi.fr" />
        <link rel="dns-prefetch" href="https://www.centrakor.com" />
        <link rel="dns-prefetch" href="https://www.lidl.fr" />
        <link rel="dns-prefetch" href="https://www.aldi.fr" />
        <link rel="dns-prefetch" href="https://bmstores.fr" />
        <link rel="dns-prefetch" href="https://www.noz.fr" />
        <link rel="dns-prefetch" href="https://www.lafoirfouille.fr" />
      </head>
      <body className="body-sans">
        <ThemeProvider>
          <div className="flex min-h-[100dvh] flex-col overflow-x-clip">
            <div id="main-content" className="min-w-0 flex-1">
              {children}
            </div>
            <Footer />
          </div>
        </ThemeProvider>
        <CookieConsentLazy />
      </body>
    </html>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo size={36} />
            <p className="mt-5 text-sm leading-6 text-ink-soft">
              Comparez les prix de vos enseignes discount préférées et trouvez l&apos;offre la plus juste en quelques secondes.
            </p>
            <p className="mt-5 meta-label">Données relevées chaque semaine</p>
          </div>

          <nav aria-label="Navigation secondaire">
            <p className="meta-label">Navigation</p>
            <div className="mt-4 flex flex-col items-start gap-3">
              <FooterLink href="/">Recherche produits</FooterLink>
              <FooterLink href="/deals">Bons plans</FooterLink>
              <FooterLink href="/a-propos">À propos</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
            </div>
          </nav>

          <nav aria-label="Informations légales">
            <p className="meta-label">Informations</p>
            <div className="mt-4 flex flex-col items-start gap-3">
              {LEGAL_PAGES.map((page) => (
                <FooterLink key={page.slug} href={`/${page.slug}`}>
                  {page.title}
                </FooterLink>
              ))}
              <ReopenCookieBannerButton className="text-sm" />
            </div>
          </nav>
        </div>

        <div className="mt-12 grid gap-6 border-t pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <a
              href="https://github.com/teefloo/comparateur-prix-discount"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-navy"
            >
              Voir le dépôt public
              <ArrowUpRight size={15} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <p className="mt-2 text-xs text-ink-faint">Le code et les scrapers sont accessibles publiquement.</p>
          </div>
          <div className="text-left text-xs text-ink-faint sm:text-right">
            <p>Les prix peuvent varier selon les stocks et les magasins.</p>
            <p className="mt-1">© {new Date().getFullYear()} {LEGAL_INFO.serviceName}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm text-ink-soft underline decoration-transparent underline-offset-4 transition-colors hover:text-navy hover:decoration-navy/40"
    >
      {children}
    </a>
  )
}
