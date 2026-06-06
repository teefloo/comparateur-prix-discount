import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, RefreshCw, ShieldCheck, ShoppingBag, TrendingDown } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { RETAILERS, RETAILER_INFO } from '@/lib/catalog'
import { absoluteUrl } from '@/lib/site'

const retailerNames = RETAILERS.map((retailer) => RETAILER_INFO[retailer].name)
const retailerLabel = retailerNames.join(', ')

export const metadata: Metadata = {
  title: 'Manifeste',
  description: `Le manifeste de ComparPrix, le comparateur de prix discount dédié à ${retailerLabel}.`,
  alternates: {
    canonical: '/a-propos',
  },
  openGraph: {
    title: 'Manifeste | ComparPrix',
    description: `Le manifeste de ComparPrix, le comparateur de prix discount dédié à ${retailerLabel}.`,
    url: absoluteUrl('/a-propos'),
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
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
    number: '01',
    title: 'Économies réelles',
    desc: "Le prix utile, sans détour. Pas d'astérisque, pas d'algorithme caché : la ligne de caisse, rien que la ligne de caisse.",
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Transparence radicale',
    desc: 'Le code source, les scrapers et la cadence des relevés sont publics. Le journalisme de prix mérite un journalisme de méthode.',
  },
  {
    icon: RefreshCw,
    number: '03',
    title: 'Données fraîches',
    desc: 'La base est reconstruite chaque semaine. Les chiffres du jour ne sont jamais ceux d’hier — et c’est tant mieux.',
  },
  {
    icon: ShoppingBag,
    number: '04',
    title: 'Toutes les enseignes',
    desc: `${retailerLabel} réunies dans un même espace, sans hiérarchie de mise en avant.`,
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <section className="relative border-b-2 border-ink bg-cream pt-32 pb-16">
        <div className="absolute inset-0 -z-10 grain" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour à l&apos;accueil
          </Link>

          <div className="mt-8 grid items-end gap-8 md:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="eyebrow text-ink-faint">№ 03 — Le manifeste</span>
                <span className="dotline h-px w-12 bg-ink/30" />
              </div>
              <h1 className="display-huge text-fluid-display text-ink text-balance">
                Le juste
                <span className="block text-navy stamp-rotate-1">prix.</span>
              </h1>
              <p className="editorial text-2xl leading-snug text-ink-soft max-w-2xl text-pretty">
                ComparPrix centralise les prix de plusieurs enseignes discount pour vous aider à repérer
                rapidement <span className="editorial-italic text-navy">la bonne affaire, au bon endroit</span>, avec moins de friction.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="border-2 border-ink bg-cream p-3 shadow-[3px_3px_0_var(--ink)]"
                >
                  <p className="display-md text-2xl text-navy tabular-nums">{stat.value}</p>
                  <p className="mt-1.5 eyebrow text-ink-faint leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="border-b-2 border-ink bg-paper py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-5">
            <h2 className="display-xl text-5xl text-ink sm:text-6xl">Nos quatre principes.</h2>
            <p className="editorial text-lg text-ink-soft max-w-md text-pretty">
              Quatre convictions qui structurent chaque ligne de code et chaque étiquette de prix du Bulletin.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((value) => (
              <article
                key={value.title}
                className="group border-2 border-ink bg-cream p-6 shadow-[4px_4px_0_var(--ink)] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[7px_7px_0_var(--ink)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center border-2 border-ink bg-navy text-cream shadow-[3px_3px_0_var(--ink)]">
                    <value.icon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="display-md text-5xl text-ink-faint/40 leading-none">{value.number}</span>
                </div>
                <h3 className="editorial mt-5 text-2xl font-medium leading-tight text-ink">{value.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft text-pretty">{value.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </main>

      <section className="border-b-2 border-ink bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-5">
            <div>
              <p className="eyebrow text-ink-faint">Le carnet d&apos;adresses</p>
              <h2 className="display-xl mt-2 text-4xl text-ink sm:text-5xl">Enseignes distribuées.</h2>
            </div>
            <p className="editorial text-base text-ink-soft max-w-md text-pretty">
              Dix acteurs discount français, lus en parallèle, sans hiérarchie de mise en avant.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {RETAILERS.map((retailerId) => {
              const retailer = RETAILER_INFO[retailerId]
              return (
                <div
                  key={retailerId}
                  className="border-2 border-ink/70 bg-cream p-4 shadow-[3px_3px_0_var(--ink)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink"
                      style={{ backgroundColor: retailer.color + '33' }}
                    >
                      <span className="mono text-[10px] font-bold" style={{ color: retailer.color }}>
                        {retailer.name.slice(0, 2).toUpperCase()}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="editorial text-base font-medium text-ink truncate">{retailer.name}</p>
                      <p className="mono text-[9px] text-ink-faint uppercase tracking-wider">{retailerId}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-paper py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="eyebrow text-ink-faint">En continu</p>
          <h2 className="display-xl mt-2 text-4xl text-ink sm:text-5xl text-balance">
            La suite vous appartient.
          </h2>
          <p className="editorial mt-4 text-lg text-ink-soft text-pretty">
            Cherchez un produit, parcourez les bons plans, ou rejoignez l&apos;aventure sur le dépôt public.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-ink inline-flex min-h-12 items-center gap-2 px-6 text-sm">
              <span className="display-md leading-none">Lancer une recherche</span>
            </Link>
            <a
              href="https://github.com/teefloo/comparateur-prix-discount"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-paper inline-flex min-h-12 items-center gap-2 px-5 text-sm"
            >
              <ArrowUpRight size={15} strokeWidth={2.5} />
              <span>Voir le dépôt GitHub</span>
            </a>
          </div>

          <p className="editorial mt-10 text-sm text-ink-faint">
            Les prix affichés sur ComparPrix sont relevés à titre indicatif. Avant tout achat,
            vérifiez le prix final sur le site de l&apos;enseigne concernée.{' '}
            <Link href="/mentions-legales" className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-navy hover:text-navy">
              Mentions légales
            </Link>
            {' · '}
            <Link href="/cgu" className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-navy hover:text-navy">
              CGU
            </Link>
            {' · '}
            <Link
              href="/politique-confidentialite"
              className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-navy hover:text-navy"
            >
              Confidentialité
            </Link>
            {' · '}
            <Link href="/cookies" className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-navy hover:text-navy">
              Cookies
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  )
}
