import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, RefreshCw, ShieldCheck, ShoppingBag, TrendingDown } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { RETAILERS, RETAILER_INFO } from '@/lib/catalog'
import { absoluteUrl } from '@/lib/site'

const retailerNames = RETAILERS.map((retailer) => RETAILER_INFO[retailer].name)
const retailerLabel = retailerNames.join(', ')

export const metadata: Metadata = {
  title: 'À propos',
  description: `En savoir plus sur ComparPrix, le comparateur de prix discount dédié à ${retailerLabel}.`,
  alternates: {
    canonical: '/a-propos',
  },
  openGraph: {
    title: 'À propos | ComparPrix',
    description: `En savoir plus sur ComparPrix, le comparateur de prix discount dédié à ${retailerLabel}.`,
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
  { label: 'Mise à jour', value: 'Hebdomadaire' },
]

const values = [
  {
    icon: TrendingDown,
    title: 'Économies maximales',
    desc: 'Chaque interface pousse vers le prix le plus utile à lire, sans détour ni surcharge visuelle.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparence totale',
    desc: 'Les prix restent lisibles, sourcés et détachés du discours marketing de chaque enseigne.',
  },
  {
    icon: RefreshCw,
    title: 'Données fraîches',
    desc: 'La base se met à jour régulièrement pour refléter les offres réellement relevées.',
  },
  {
    icon: ShoppingBag,
    title: 'Toutes les enseignes',
    desc: `${retailerLabel} réunies dans un même espace de recherche et de comparaison.`,
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:pt-28">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent dark:text-slate-400"
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="space-y-8">
            <div className="max-w-2xl">
              <p className="section-label">À propos</p>
              <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl dark:text-slate-50">
                Un comparateur pensé comme un outil de décision.
              </h1>
              <p className="support-copy mt-5 text-base sm:text-lg">
                ComparPrix centralise les prix de plusieurs enseignes discount pour vous aider à repérer rapidement la bonne offre,
                au bon endroit, avec moins de friction.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="surface px-5 py-5">
                  <p className="font-display text-3xl font-semibold tracking-tight text-accent tabular-nums">{stat.value}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.24em] text-subtle dark:text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <section className="surface p-6 sm:p-7">
              <p className="section-label">Logique UX</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {values.map((value) => (
                  <div key={value.title} className="rounded-lg border border-line bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-line bg-accent-subtle p-2 text-accent dark:border-slate-700 dark:bg-accent/15">
                        <value.icon size={18} />
                      </div>
                      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground dark:text-slate-100">
                        {value.title}
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-400">{value.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="surface p-6">
              <p className="section-label">Enseignes suivies</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {retailerNames.map((name, index) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RETAILER_INFO[RETAILERS[index]].color }} />
                    {name}
                  </span>
                ))}
              </div>
            </section>

            <section className="surface p-6">
              <p className="section-label">Ressources</p>
              <div className="mt-4 space-y-3 text-sm text-muted dark:text-slate-300">
                <p>Prix relevés sur les plateformes des enseignes, puis normalisés pour rester lisibles dans une vue unique.</p>
                <p>Les pages produit gardent le contexte utile, les liens d&apos;origine et les métadonnées de partage.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://github.com/teefloo/comparateur-prix-discount"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[12px] bg-foreground px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                >
                  <ExternalLink size={14} />
                  GitHub
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  Rechercher
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  )
}
