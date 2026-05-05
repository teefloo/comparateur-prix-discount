'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, Database, RefreshCw, Search, ShieldCheck, Tag, TrendingDown, Users } from 'lucide-react'

import RetailerFilterPanel from './RetailerFilterPanel'
import { RETAILERS, RETAILER_INFO, type SupportedCategory } from '@/lib/catalog'
import { getSearchSourceLabel, type SearchSource } from '@/lib/search-ui'

interface SearchWorkspaceProps {
  search: string
  selectedCategory: SupportedCategory | null
  source: SearchSource
  lastUpdate: string | null
  error?: string
}

export default function SearchWorkspace({ search, selectedCategory, source, lastUpdate, error }: SearchWorkspaceProps) {
  const hasSearchContext = Boolean(search || selectedCategory)
  const sourceLabel = source ? getSearchSourceLabel(source) : null

  return (
    <section className="border-b border-line/70 bg-paper/90 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:pt-24 lg:pb-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              Mise à jour hebdomadaire en direct
            </div>

            <div className="max-w-3xl">
              <p className="section-label">Recherche rapide</p>
              <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl lg:text-[4.1rem] dark:text-slate-50">
                Comparez les prix discount en un seul écran.
              </h1>
              <p className="support-copy mt-4 max-w-2xl text-base sm:text-lg">
                Tapez un produit, filtrez par univers ou enseigne, et voyez tout de suite l&apos;offre la plus utile.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: TrendingDown, label: 'Prix le plus lisible', desc: 'Lecture rapide des écarts et promos.' },
                { icon: ShieldCheck, label: 'Données vérifiées', desc: 'Base, scraping live ou fallback selon le contexte.' },
                { icon: Users, label: `${RETAILERS.length} enseignes`, desc: RETAILERS.map((retailer) => RETAILER_INFO[retailer].name).join(' · ') },
              ].map((item) => (
                <div key={item.label} className="surface px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-line bg-accent-subtle p-2 text-accent dark:border-slate-700 dark:bg-accent/15">
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

          <div className="space-y-4">
            <div className="surface-strong p-4 sm:p-5">
              <form action="/" method="get" className="space-y-4">
                {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                <div className="field-shell p-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle dark:text-slate-500" size={18} />
                      <input
                        name="query"
                        type="text"
                        defaultValue={search}
                        placeholder="Lessive, gel douche, bonbons..."
                        aria-label="Rechercher un produit"
                        className="w-full rounded-[12px] bg-transparent py-4 pl-11 pr-4 text-base text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-foreground px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                    >
                      Comparer
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href="/deals" className="nav-pill nav-pill-active">
                    <Tag size={14} />
                    Bons plans
                  </Link>
                </div>

                {hasSearchContext && (
                  <div
                    className={`flex items-start gap-3 rounded-[12px] border px-4 py-3 text-sm ${
                      error
                        ? 'border-danger/20 bg-danger/5 text-danger dark:border-danger/30 dark:bg-danger/10'
                        : source === 'demo-fallback'
                          ? 'border-warning/20 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/10'
                          : 'border-accent/20 bg-accent-subtle/80 text-foreground dark:border-accent/30 dark:bg-accent/10 dark:text-slate-100'
                    }`}
                    aria-live="polite"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/15 bg-white/80 dark:bg-slate-950/40">
                      {error ? <AlertTriangle size={16} /> : source === 'demo-fallback' ? <RefreshCw size={16} /> : <Database size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{error ? 'Recherche temporairement indisponible' : sourceLabel ?? 'Recherche prête'}</p>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">
                        {error
                          ? error
                          : source === 'demo-fallback'
                            ? 'Les résultats affichés proviennent du mode dégradé.'
                            : 'La source la plus fiable disponible est affichée ici.'}
                      </p>
                      {lastUpdate && !error && (
                        <p className="mt-2 text-[11px] font-medium opacity-80">
                          Dernier relevé :{' '}
                          {new Date(lastUpdate).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <RetailerFilterPanel />
          </div>
        </div>
      </div>
    </section>
  )
}
