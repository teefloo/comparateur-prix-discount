'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Calendar, ExternalLink, Tag } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { CATEGORY_LABELS, RETAILER_INFO } from '@/lib/catalog'
import type { RetailerOfferCard } from '@/lib/types'

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Date inconnue'

  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ProductPage() {
  const params = useParams()
  const [offer, setOffer] = useState<RetailerOfferCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOffer() {
      const id = params.id as string
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/produit/${id}`)
        const data = await response.json()

        if (!response.ok || data.error) {
          setError(data.error || 'Offre introuvable')
          setOffer(null)
          return
        }

        setOffer(data.offer as RetailerOfferCard)
      } catch (_error) {
        setError('Impossible de récupérer les données de cette offre')
        setOffer(null)
      } finally {
        setLoading(false)
      }
    }

    void fetchOffer()
  }, [params.id])

  if (loading) {
    return (
      <div className="grain min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-8 text-slate-500 font-medium animate-pulse">Chargement de l’offre...</p>
        </div>
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="grain min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-4">Oups ! Offre introuvable</h1>
          <p className="text-slate-500 mb-12 max-w-sm mx-auto">
            {error || 'Cette offre n’existe pas encore dans notre base de données.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange text-white font-bold rounded-2xl hover:bg-brand-navy transition-all shadow-xl shadow-brand-orange/20"
          >
            <ArrowLeft size={18} /> Retour à la recherche
          </Link>
        </div>
      </div>
    )
  }

  const retailer = RETAILER_INFO[offer.retailer]

  return (
    <div className="grain min-h-screen">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-orange mb-10 transition-colors group font-bold text-sm"
        >
          <div className="p-2 rounded-lg group-hover:bg-brand-cream transition-colors">
            <ArrowLeft size={16} />
          </div>
          Retour à la recherche
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5"
          >
            <div className="glass p-8 rounded-[2rem] sticky top-32">
              <div className="aspect-square bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100/50 mb-8 p-6 group">
                {offer.image ? (
                  <img
                    src={offer.image}
                    alt={offer.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-7xl opacity-20">📦</span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                    {CATEGORY_LABELS[offer.category] || offer.category}
                  </span>
                  <span className="px-3 py-1 bg-brand-cream text-brand-orange text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-orange/20">
                    {retailer.name}
                  </span>
                  {offer.brand && (
                    <span className="px-3 py-1 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                      {offer.brand}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-heading font-black text-slate-900 leading-tight">{offer.name}</h1>

                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                  <Calendar size={14} className="text-brand-orange" />
                  Dernier relevé : {formatDate(offer.lastUpdated)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7"
          >
            <div className="space-y-6">
              <div className="bg-brand-orange p-8 rounded-[2rem] text-white shadow-2xl shadow-brand-orange/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-2">Offre en cours</p>
                    <h2 className="text-4xl font-heading font-black">{formatPrice(offer.price)}</h2>
                    {offer.unitPrice && offer.unitPriceLabel && (
                      <p className="text-white/80 text-sm mt-2 font-medium">
                        {formatPrice(offer.unitPrice)}
                        {offer.unitPriceLabel}
                      </p>
                    )}
                  </div>
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black shadow-lg"
                    style={{ backgroundColor: `${retailer.color}33` }}
                  >
                    {retailer.logo}
                  </div>
                </div>
              </div>

              <div className="glass rounded-[2rem] overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                  <h3 className="text-xl font-heading font-bold text-slate-900">Détails de l’offre</h3>
                </div>

                <div className="p-8 space-y-6">
                  {offer.quantity && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conditionnement</p>
                      <p className="text-slate-900 font-bold">{offer.quantity}</p>
                    </div>
                  )}

                  {offer.availability && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disponibilité</p>
                      <p className="text-slate-900 font-bold">{offer.availability}</p>
                    </div>
                  )}

                  {offer.description && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-slate-600 leading-relaxed">{offer.description}</p>
                    </div>
                  )}

                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-brand-orange transition-colors"
                  >
                    Voir la fiche enseigne <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-6 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                <Tag size={16} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                  Cette page affiche désormais une offre enseigne unique, avec son prix, sa disponibilité et son lien
                  d’origine.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
