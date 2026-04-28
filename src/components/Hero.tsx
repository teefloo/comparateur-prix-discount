'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Search, ShieldCheck, ShoppingBag, TrendingDown } from 'lucide-react'

interface HeroProps {
  search: string
  setSearch: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
}

export default function Hero({ search, setSearch, onSubmit, loading }: HeroProps) {
  return (
    <section className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-b from-accent-subtle/50 to-white dark:from-slate-800 dark:to-slate-900">
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-accent dark:text-slate-100 text-sm font-semibold mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
        >
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          Mise à jour hebdomadaire en direct
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight dark:text-slate-100">
          Optimisez votre budget <span className="text-gradient-primary">sans compromis.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted mb-10 max-w-2xl mx-auto leading-relaxed dark:text-slate-400">
          Le seul outil qui compare instantanément Action, Stokomani, B&M et Centrakor pour vous garantir le prix le plus bas sur vos produits du quotidien.
        </p>

        <form onSubmit={onSubmit} className="max-w-2xl mx-auto mb-14">
          <div className="input-wrapper p-1">
            <div className="flex flex-col sm:flex-row gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle dark:text-slate-500" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Lessive, gel douche, bonbons..."
                  className="w-full bg-transparent pl-11 pr-4 py-3.5 text-base outline-none text-foreground placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-3.5 px-8 flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Comparer <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 max-w-4xl mx-auto snapshot-scroll pb-2"
        >
          {[
            { icon: TrendingDown, label: "Jusqu'à -40% d'économie", desc: 'Par rapport aux supermarchés' },
            { icon: ShieldCheck, label: 'Données vérifiées', desc: 'Mises à jour manuellement' },
            { icon: ShoppingBag, label: '5 enseignes leader', desc: 'Action, B&M, Stokomani, Centrakor, Aldi' },
          ].map((feature, idx) => (
            <div key={idx} className="card-hover p-5 flex flex-col items-center min-w-[240px] snap-start">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-accent bg-accent-subtle mb-3 dark:bg-accent/15">
                <feature.icon size={20} />
              </div>
              <p className="font-bold text-foreground text-sm mb-0.5 dark:text-slate-100">{feature.label}</p>
              <p className="text-muted text-xs dark:text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
