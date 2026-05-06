'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, BadgeCheck, Search, Sparkles, Tag } from 'lucide-react'

import RetailerFilterPanel from './RetailerFilterPanel'
import { CATEGORY_LABELS, type SupportedCategory } from '@/lib/catalog'
import type { SearchSource } from '@/lib/search-ui'

interface SearchWorkspaceProps {
  search: string
  selectedCategory: SupportedCategory | null
  source: SearchSource
  lastUpdate: string | null
  error?: string
}

export default function SearchWorkspace({ search, selectedCategory, source, lastUpdate, error }: SearchWorkspaceProps) {
  const hasSearchContext = Boolean(search || selectedCategory)
  const quickSearches = ['Lessive', 'Gel douche', 'Café', 'Bonbons'] as const
  const quickCategories: SupportedCategory[] = ['menage', 'alimentation', 'hygiene', 'bazar', 'jardin', 'loisirs']

  const buildHref = (params: { query?: string; category?: SupportedCategory }) => {
    const searchParams = new URLSearchParams()

    if (params.query) {
      searchParams.set('query', params.query)
    }

    if (params.category) {
      searchParams.set('category', params.category)
    }

    const queryString = searchParams.toString()
    return queryString ? `/?${queryString}` : '/'
  }

  const statusMessage = (() => {
    if (error) {
      return 'Impossible de charger les résultats pour le moment. Réessayez.'
    }

    if (source === 'demo-fallback') {
      return 'Exemples affichés en attendant les données à jour.'
    }

    if (lastUpdate) {
      return `Résultats mis à jour le ${new Date(lastUpdate).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}.`
    }

    return 'Résultats prêts.'
  })()

  return (
    <section className="border-b border-line/70 bg-paper/90 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:pb-10 lg:pt-24">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-4">
            <p className="section-label">Recherche simple</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl lg:text-[3.9rem] dark:text-slate-50">
              Comparez un prix discount en quelques secondes.
            </h1>
            <p className="support-copy max-w-2xl text-base sm:text-lg">
              Entrez un produit et voyez les offres disponibles chez Action, Stokomani, B&M, Aldi, GiFi, Lidl et plus.
            </p>
          </div>

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
                      placeholder="Ex. lessive, café, gel douche"
                      aria-label="Rechercher un produit"
                      className="w-full rounded-[12px] bg-transparent py-4 pl-11 pr-4 text-base text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-foreground px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                  >
                    Comparer les prix
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/deals" className="nav-pill nav-pill-active">
                  <Tag size={14} />
                  Voir les bons plans
                </Link>
              </div>

              {!hasSearchContext && (
                <div className="space-y-5 border-t border-line/70 pt-5 dark:border-slate-800">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-accent" />
                      <p className="section-label">Essais rapides</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickSearches.map((item) => (
                        <Link key={item} href={buildHref({ query: item })} className="nav-pill min-h-11 px-4 py-3 text-sm">
                          {item}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="section-label">Explorer par rayon</p>
                    <div className="flex flex-wrap gap-2">
                      {quickCategories.map((category) => (
                        <Link
                          key={category}
                          href={buildHref({ category })}
                          className="nav-pill min-h-11 px-4 py-3 text-sm"
                        >
                          {CATEGORY_LABELS[category]}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                    {error ? <AlertTriangle size={16} /> : source === 'demo-fallback' ? <Sparkles size={16} /> : <BadgeCheck size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{statusMessage}</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          <RetailerFilterPanel />
        </div>
      </div>
    </section>
  )
}
