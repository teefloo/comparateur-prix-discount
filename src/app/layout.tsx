import type { Metadata } from 'next'
import { Bricolage_Grotesque, Big_Shoulders, Fraunces, JetBrains_Mono } from 'next/font/google'
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

const bigShoulders = Big_Shoulders({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Arial Black', 'Impact', 'system-ui'],
  adjustFontFallback: true,
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-editorial',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'ComparPrix — Le Bulletin des Prix Discount',
    template: '%s | ComparPrix',
  },
  description:
    "Le bulletin de chasse aux bonnes affaires : comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ComparPrix — Le Bulletin des Prix Discount',
    description:
      "Le bulletin de chasse aux bonnes affaires : comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
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
    title: 'ComparPrix — Le Bulletin des Prix Discount',
    description:
      "Le bulletin de chasse aux bonnes affaires : comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${bigShoulders.variable} ${fraunces.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
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
          <div className="flex min-h-screen flex-col overflow-x-clip">
            <div className="flex-1 min-w-0 pb-20 md:pb-0">{children}</div>
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
    <footer className="border-t-2 border-ink/85 bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rule-double" />
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Logo />
            <p className="editorial text-base leading-relaxed text-ink-soft max-w-md text-pretty">
              Le journal de celles et ceux qui traquent la bonne affaire. Une seule liste, dix enseignes, et toujours le prix le plus juste à portée de main.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-ink-faint">№ 01 — Hebdo</span>
              <span className="dotline h-px w-12 bg-ink/30" />
              <span className="eyebrow text-ink-faint">10 enseignes</span>
            </div>
          </div>

          <div>
            <p className="eyebrow text-ink-faint">Le Bulletin</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <FooterLink href="/">Recherche produits</FooterLink>
              <FooterLink href="/deals">Bons plans du moment</FooterLink>
              <FooterLink href="/a-propos">Manifeste</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
            </div>
          </div>

          <div>
            <p className="eyebrow text-ink-faint">Légal & RGPD</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {LEGAL_PAGES.map((page) => (
                <FooterLink key={page.slug} href={`/${page.slug}`}>
                  {page.title}
                </FooterLink>
              ))}
              <div className="pt-1">
                <ReopenCookieBannerButton className="text-xs" />
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow text-ink-faint">Sources</p>
            <a
              href="https://github.com/teefloo/comparateur-prix-discount"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 group flex items-center justify-between gap-3 border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_var(--ink)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--ink)]"
            >
              <div>
                <p className="display-md text-xl text-ink">Dépôt public</p>
                <p className="eyebrow text-ink-faint mt-1">teefloo / github</p>
              </div>
              <ArrowUpRight size={18} className="text-ink transition-transform group-hover:rotate-45" />
            </a>
            <p className="mt-3 text-xs text-ink-faint leading-relaxed">
              Le code source, les scrapers et le planning hebdomadaire sont publics.
            </p>
          </div>
        </div>

        <div className="rule-double" />
        <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="eyebrow text-ink-faint">Les prix varient selon les stocks et les relevés.</p>
          <p className="eyebrow text-ink-faint">
            © {new Date().getFullYear()} {LEGAL_INFO.serviceName} ·{' '}
            <a href="/mentions-legales" className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
              Mentions légales
            </a>
            {' · '}
            <a
              href={`mailto:${LEGAL_INFO.publisher.contactEmail}`}
              className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            >
              Contact
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="editorial text-lg text-ink underline decoration-ink/30 decoration-1 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy"
    >
      {children}
    </a>
  )
}
