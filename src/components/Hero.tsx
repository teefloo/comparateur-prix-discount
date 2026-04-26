'use client'

import { motion } from 'framer-motion'
import { Search, ArrowRight, Zap, ShieldCheck, TrendingDown, ShoppingBag } from 'lucide-react'

interface HeroProps {
  search: string
  setSearch: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
}

export default function Hero({ search, setSearch, onSubmit, loading }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-sm font-semibold mb-8"
        >
          <Zap size={14} className="fill-brand-orange" />
          Mise à jour hebdomadaire en direct
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-heading font-extrabold text-slate-900 mb-6 leading-tight tracking-tight"
        >
          Optimisez votre budget <br />
          <span className="text-gradient">sans compromis.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Le seul outil qui compare instantanément Action, Stokomani, B&M et Centrakor pour vous garantir le prix le plus bas sur vos produits du quotidien.
        </motion.p>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={onSubmit}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="group relative glass p-2 rounded-3xl shadow-2xl transition-all focus-within:shadow-brand-orange/20 focus-within:ring-2 focus-within:ring-brand-orange/20">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Lessive, gel douche, bonbons..."
                  className="w-full bg-transparent pl-14 pr-6 py-5 text-lg font-medium outline-none text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-orange text-white font-bold py-5 px-10 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-navy active:scale-95 transition-all shadow-lg shadow-brand-orange/20 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Comparer <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Stats / Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            { icon: TrendingDown, label: "Jusqu'à -40% d'économie", desc: "Par rapport aux supermarchés" },
            { icon: ShieldCheck, label: "Données Vérifiées", desc: "Mises à jour manuellement" },
            { icon: ShoppingBag, label: "5 Enseignes Leader", desc: "Action, B&M, Stokomani, Centrakor, Aldi" }
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-sm border border-slate-100 mb-4 transition-transform hover:-translate-y-1">
                <feature.icon size={24} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{feature.label}</h4>
              <p className="text-slate-500 text-xs">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

