import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, TrendingDown, ShieldCheck, ShoppingBag, RefreshCw, ExternalLink } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'En savoir plus sur ComparPrix, le comparateur de prix discount dédié à Action, Stokomani, B&M, Centrakor et Aldi.',
  alternates: {
    canonical: '/a-propos',
  },
  openGraph: {
    title: 'À propos | ComparPrix',
    description:
      'En savoir plus sur ComparPrix, le comparateur de prix discount dédié à Action, Stokomani, B&M, Centrakor et Aldi.',
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
  { label: 'Enseignes comparées', value: '5' },
  { label: 'Catégories de produits', value: '9' },
  { label: 'Mise à jour', value: 'Hebdomadaire' },
]

const retailers = [
  { name: 'Action', color: 'bg-red-500' },
  { name: 'B&M', color: 'bg-blue-600' },
  { name: 'Stokomani', color: 'bg-green-600' },
  { name: 'Centrakor', color: 'bg-purple-600' },
  { name: 'Aldi', color: 'bg-yellow-500' },
]

const values = [
  {
    icon: TrendingDown,
    title: 'Économies maximales',
    desc: "Nous comparons les prix pour vous garantir le meilleur rapport qualité-prix sur chaque produit.",
  },
  {
    icon: ShieldCheck,
    title: 'Transparence totale',
    desc: 'Les prix sont affichés tels que relevés, sans filtre ni commission cachée.',
  },
  {
    icon: RefreshCw,
    title: 'Données à jour',
    desc: 'Notre base est actualisée chaque semaine pour refléter les offres en magasin.',
  },
  {
    icon: ShoppingBag,
    title: 'Toutes les enseignes',
    desc: 'Action, B&M, Stokomani, Centrakor et Aldi réunies sur une seule plateforme.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors mb-8 dark:text-slate-400"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 dark:text-slate-100">
            À propos de <span className="text-accent">Compar</span>Prix
          </h1>

          <p className="text-lg text-muted leading-relaxed mb-12 dark:text-slate-400">
            ComparPrix est un comparateur de prix gratuit dédié aux enseignes de discount.
            Notre mission&nbsp;: vous aider à faire les meilleurs choix sans passer des heures à comparer.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="card p-5 text-center">
                <p className="text-3xl font-bold text-accent mb-1">{stat.value}</p>
                <p className="text-xs text-muted dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 dark:text-slate-100">Notre mission</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((v) => (
                <div key={v.title} className="card-hover p-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-accent bg-accent-subtle mb-4 dark:bg-accent/15">
                    <v.icon size={20} />
                  </div>
                  <h3 className="font-bold text-foreground mb-1 dark:text-slate-100">{v.title}</h3>
                  <p className="text-sm text-muted leading-relaxed dark:text-slate-400">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 dark:text-slate-100">Enseignes suivies</h2>
            <div className="flex flex-wrap gap-3">
              {retailers.map((r) => (
                <span
                  key={r.name}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-sm font-semibold text-foreground border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                  {r.name}
                </span>
              ))}
            </div>
          </section>

          <section className="card p-8 border-accent/30 bg-accent-subtle/20 dark:bg-accent/5">
            <h2 className="text-2xl font-bold text-foreground mb-4 dark:text-slate-100">Une question&nbsp;?</h2>
            <p className="text-muted mb-6 dark:text-slate-400">
              Vous avez une suggestion ou vous avez repéré une erreur&nbsp;? N&apos;hésitez pas à nous contacter ou à contribuer sur GitHub.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/teefloo"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                <ExternalLink size={16} />
                Nous écrire
              </a>
              <a
                href="https://github.com/teefloo/comparateur-prix-discount"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                <ExternalLink size={16} />
                Contribuer sur GitHub
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
