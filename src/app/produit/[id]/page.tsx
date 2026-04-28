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
      } catch {
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
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-6 text-muted font-medium dark:text-slate-400">Chargement de l&apos;offre...</p>
        </div>
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 dark:text-slate-100">Oups ! Offre introuvable</h1>
          <p className="text-muted mb-8 max-w-sm mx-auto text-sm dark:text-slate-400">
            {error || 'Cette offre n&apos;existe pas encore dans notre base de données.'}
          </p>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3"
          >
            <ArrowLeft size={16} /> Retour à la recherche
          </Link>
        </div>
      </div>
    )
  }

  const retailer = RETAILER_INFO[offer.retailer]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-accent mb-8 transition-colors font-medium text-sm dark:text-slate-400 dark:hover:text-accent"
        >
          <ArrowLeft size={16} />
          Retour à la recherche
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5"
          >
            <div className="card p-6 sticky top-24">
              <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 mb-6 p-4 dark:bg-slate-700/50 dark:border-slate-700">
                {offer.image ? (
                  <img
                    src={offer.image}
                    alt={offer.name}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-6xl opacity-20">📦</span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-muted text-[10px] font-bold uppercase tracking-widest dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">
                    {CATEGORY_LABELS[offer.category] || offer.category}
                  </span>
                  <span className="px-3 py-1 bg-accent-subtle border border-accent/20 rounded-full text-accent text-[10px] font-bold uppercase tracking-widest dark:bg-accent/15">
                    {retailer.name}
                  </span>
                  {offer.brand && (
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-muted text-[10px] font-bold uppercase tracking-widest dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">
                      {offer.brand}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-foreground leading-tight dark:text-slate-100">{offer.name}</h1>

                <div className="flex items-center gap-2 text-muted text-xs font-medium bg-slate-50 border border-slate-200 p-3 rounded-xl dark:bg-slate-700/50 dark:border-slate-700 dark:text-slate-400">
                  <Calendar size={14} className="text-accent" />
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
              <div className="bg-accent p-8 rounded-2xl text-white shadow-accent-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Offre en cours</p>
                      <h2 className="text-3xl font-bold">{formatPrice(offer.price)}</h2>
                      {offer.unitPrice && offer.unitPriceLabel && (
                        <p className="text-white/70 text-sm mt-1 font-medium">
                          {formatPrice(offer.unitPrice)}
                          {offer.unitPriceLabel}
                        </p>
                      )}
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
                      style={{ backgroundColor: retailer.color }}
                    >
                      <span className="text-white">{retailer.logo}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-foreground dark:text-slate-100">Détails de l&apos;offre</h3>
                </div>

                <div className="p-6 space-y-5">
                  {offer.quantity && (
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 dark:text-slate-400">Conditionnement</p>
                      <p className="text-foreground font-semibold dark:text-slate-200">{offer.quantity}</p>
                    </div>
                  )}

                  {offer.availability && (
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 dark:text-slate-400">Disponibilité</p>
                      <p className="text-foreground font-semibold dark:text-slate-200">{offer.availability}</p>
                    </div>
                  )}

                  {offer.description && (
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 dark:text-slate-400">Description</p>
                      <p className="text-muted leading-relaxed text-sm dark:text-slate-400">{offer.description}</p>
                    </div>
                  )}

                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    Voir la fiche enseigne <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-700/50 dark:border-slate-700">
                <Tag size={14} className="text-muted dark:text-slate-400" />
                <p className="text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest dark:text-slate-400">
                  Cette page affiche d&eacute;sormais une offre enseigne unique, avec son prix, sa disponibilit&eacute; et son lien d&apos;origine.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
