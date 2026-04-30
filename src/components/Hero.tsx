'use client'

import Image from 'next/image'
import { ArrowRight, Search, ShieldCheck, Sparkles, Store, TrendingDown } from 'lucide-react'

import { RETAILERS, RETAILER_INFO, CATEGORY_LABELS, SUPPORTED_CATEGORIES, type SupportedCategory } from '@/lib/catalog'

interface HeroProps {
  search: string
  selectedCategory: SupportedCategory | null
}

export default function Hero({ search, selectedCategory }: HeroProps) {
  const retailerNames = RETAILERS.map((retailer) => RETAILER_INFO[retailer].name)
  const highlightCategories = SUPPORTED_CATEGORIES.slice(0, 6)

  return (
    <section className="border-b border-line bg-paper dark:border-slate-800 dark:bg-slate-950/20">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:pb-12 lg:pt-28">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-start">
          <div className="min-w-0 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              Mises à jour hebdomadaires, prix et stocks vérifiés
            </div>

            <div className="max-w-3xl">
              <p className="section-label">Price Lab</p>
              <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl dark:text-slate-50">
                Comparez les prix discount sans perdre de temps.
              </h1>
              <p className="support-copy mt-5 max-w-2xl text-base sm:text-lg">
                Recherchez un produit, filtrez par catégorie ou enseigne, puis gardez sous les yeux l&apos;offre la plus pertinente en un seul écran.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: TrendingDown, label: 'Meilleur prix visible', desc: 'Lecture rapide des écarts de prix' },
                { icon: ShieldCheck, label: 'Données vérifiées', desc: 'Source base ou scraping live selon contexte' },
                { icon: Store, label: `${RETAILERS.length} enseignes`, desc: retailerNames.join(' · ') },
              ].map((item) => (
                <div key={item.label} className="surface px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-line bg-accent-subtle p-2 text-accent dark:border-slate-700 dark:bg-accent/15">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-slate-100">{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            <div className="surface-strong p-5 sm:p-6">
              <form action="/" method="get" className="field-shell p-2">
                {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle dark:text-slate-500" size={18} />
                    <input
                      name="query"
                      type="text"
                      defaultValue={search}
                      placeholder="Lessive, gel douche, bonbons..."
                      aria-label="Rechercher un produit"
                      className="w-full rounded-[1.15rem] bg-transparent py-4 pl-11 pr-4 text-base text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] bg-foreground px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                  >
                    Comparer
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>

              <div className="mt-5">
                <p className="section-label mb-3">Raccourcis</p>
                <div className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap md:overflow-visible">
                  {highlightCategories.map((category) => (
                    <span key={category} className="nav-pill shrink-0 snap-start">
                      {CATEGORY_LABELS[category]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-label">Enseignes suivies</p>
                  <p className="mt-2 text-sm font-medium text-foreground dark:text-slate-100">
                    Logos, couleurs et liens gardés comme repères de navigation.
                  </p>
                </div>
                <Sparkles size={18} className="text-accent" />
              </div>
              <div className="mt-4 flex snap-x snap-proximity gap-3 overflow-x-auto pb-1 scrollbar-none md:flex-wrap md:overflow-visible">
                {RETAILERS.map((retailer) => {
                  const info = RETAILER_INFO[retailer]
                  return (
                    <div
                      key={retailer}
                      className="flex min-w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white"
                        style={{ borderColor: info.color }}
                      >
                        <Image src={info.logo} alt={info.name} width={32} height={32} className="h-8 w-8 object-contain" unoptimized />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground dark:text-slate-200">{info.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
