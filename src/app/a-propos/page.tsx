import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight, RefreshCw, ShieldCheck, ShoppingBag, TrendingDown } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { RETAILERS, RETAILER_INFO } from '@/lib/catalog'
import { absoluteUrl } from '@/lib/site'

const retailerNames = RETAILERS.map((retailer) => RETAILER_INFO[retailer].name)
const retailerLabel = retailerNames.join(', ')

export const metadata: Metadata = {
  title: 'À propos',
  description: `Le manifeste de ComparPrix, le comparateur de prix discount dédié à ${retailerLabel}.`,
  alternates: {
    canonical: '/a-propos',
  },
  openGraph: {
    title: 'À propos | ComparPrix',
    description: `Le manifeste de ComparPrix, le comparateur de prix discount dédié à ${retailerLabel}.`,
    url: absoluteUrl('/a-propos'),
    type: 'website',
    images: [
      {
        url: '/brand/comparprix-social.svg',
        width: 1200,
        height: 630,
        alt: 'ComparPrix',
      },
    ],
  },
}

const stats = [
  { label: 'Enseignes comparées', value: String(RETAILERS.length) },
  { label: 'Catégories suivies', value: '13' },
  { label: 'Mise à jour', value: 'Hebdo' },
]

const values = [
  {
    icon: TrendingDown,
    title: 'Économies réelles',
    desc: "Le prix utile, sans détour. ComparPrix rassemble les données publiées par les enseignes pour faciliter la décision.",
  },
  {
    icon: ShieldCheck,
    title: 'Transparence',
    desc: 'Le code source, les scrapers et la cadence des relevés sont publics. La méthode compte autant que le résultat.',
  },
  {
    icon: RefreshCw,
    title: 'Données fraîches',
    desc: 'La base est reconstruite chaque semaine afin de rapprocher la comparaison des prix réellement disponibles.',
  },
  {
    icon: ShoppingBag,
    title: 'Toutes les enseignes',
    desc: `${retailerLabel} réunies dans un même espace, sans hiérarchie de mise en avant.`,
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <section className="border-b bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy">
            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:gap-16">
            <div className="max-w-3xl">
              <p className="meta-label">À propos de ComparPrix</p>
              <h1 className="display-huge mt-3 text-fluid-display text-balance">
                Le juste <span className="text-navy">prix.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-7 text-ink-soft sm:text-xl">
                ComparPrix centralise les prix de plusieurs enseignes discount pour vous aider à repérer rapidement la bonne affaire, au bon endroit.
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-4 border-t pt-5 lg:block lg:border-l lg:border-t-0 lg:pl-6">
              {stats.map((stat) => (
                <div key={stat.label} className="lg:mb-5 lg:last:mb-0">
                  <dt className="meta-label">{stat.label}</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <main className="border-b bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="meta-label">Nos principes</p>
            <h2 className="display-xl mt-3 text-balance">Une comparaison utile commence par une méthode claire.</h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <article key={value.title} className="surface-elevated p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy">
                  <value.icon size={20} strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">{value.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-ink-soft">{value.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </main>

      <section className="border-b bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="meta-label">Couverture</p>
              <h2 className="display-xl mt-3">Les enseignes suivies.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-ink-soft">Dix acteurs discount réunis dans un même comparateur, sans classement sponsorisé.</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {RETAILERS.map((retailerId) => {
              const retailer = RETAILER_INFO[retailerId]
              return (
                <div key={retailerId} className="flex min-h-14 items-center gap-3 rounded-lg border bg-cream px-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-paper-2">
                    <Image src={retailer.logo} alt={retailer.name} width={20} height={20} className="h-5 w-5 object-contain" />
                  </span>
                  <span className="truncate text-sm font-medium text-ink">{retailer.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="meta-label">À vous de jouer</p>
          <h2 className="display-xl mt-3 text-balance">Commencez par un produit.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-ink-soft">
            Cherchez une référence, parcourez les bons plans ou consultez le dépôt public pour comprendre le projet.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary inline-flex min-h-12 items-center gap-2 px-6 text-sm">
              Lancer une recherche
            </Link>
            <a href="https://github.com/teefloo/comparateur-prix-discount" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex min-h-12 items-center gap-2 px-5 text-sm">
              Voir le dépôt GitHub
              <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>

          <p className="mt-10 text-xs leading-5 text-ink-faint">
            Les prix affichés sont indicatifs. Vérifiez toujours le prix final sur le site de l&apos;enseigne concernée.{' '}
            <Link href="/mentions-legales" className="text-ink underline decoration-border-strong underline-offset-2 hover:text-navy">Mentions légales</Link>
            {' · '}
            <Link href="/cgu" className="text-ink underline decoration-border-strong underline-offset-2 hover:text-navy">CGU</Link>
            {' · '}
            <Link href="/politique-confidentialite" className="text-ink underline decoration-border-strong underline-offset-2 hover:text-navy">Confidentialité</Link>
            {' · '}
            <Link href="/cookies" className="text-ink underline decoration-border-strong underline-offset-2 hover:text-navy">Cookies</Link>
            .
          </p>
        </div>
      </section>
    </>
  )
}
