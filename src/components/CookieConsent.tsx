'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, Settings2, X } from 'lucide-react'

const STORAGE_KEY = 'comparprix.cookie-consent'

type ConsentRecord = {
  acknowledged: boolean
  acknowledgedAt: string
  version: string
}

const CONSENT_VERSION = '2026-06-01'

function readConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentRecord
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeConsent(record: ConsentRecord) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    window.dispatchEvent(new CustomEvent('comparprix:cookie-consent', { detail: record }))
  } catch {
    /* ignore quota errors */
  }
}

function clearConsent() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = readConsent()
    if (!consent) {
      const timer = window.setTimeout(() => setVisible(true), 400)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [])

  useEffect(() => {
    const handler = () => setVisible(true)
    window.addEventListener('comparprix:reopen-cookie-banner', handler)
    return () => window.removeEventListener('comparprix:reopen-cookie-banner', handler)
  }, [])

  const acknowledge = useCallback(() => {
    writeConsent({
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    })
    setVisible(false)
    setShowDetails(false)
  }, [])

  const reset = useCallback(() => {
    clearConsent()
    setShowDetails(false)
    setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Information sur les cookies"
      className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md"
    >
      <div className="border-2 border-ink bg-cream p-4 shadow-[5px_5px_0_var(--ink)]">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center border-2 border-ink bg-navy text-cream shadow-[2px_2px_0_var(--ink)]"
            aria-hidden
          >
            <Cookie size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="display-md text-sm uppercase tracking-wider text-ink">Cookies — version courte</p>
            <p className="editorial mt-1.5 text-sm leading-relaxed text-ink-soft">
              ComparPrix utilise uniquement le stockage local de votre navigateur pour mémoriser
              votre thème (clair / sombre). Aucun cookie publicitaire, aucun tracker tiers, aucune
              mesure d&apos;audience.
            </p>

            {showDetails ? (
              <ul className="mt-3 space-y-1.5 border-t border-ink/15 pt-3 text-xs text-ink-soft">
                <li className="flex justify-between gap-3">
                  <span>
                    <span className="mono font-bold text-ink">localStorage</span> · Thème
                    (fonctionnel)
                  </span>
                  <span className="mono text-ink-faint">12 mois</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>
                    <span className="mono font-bold text-ink">localStorage</span> · Consentement
                    bandeau
                  </span>
                  <span className="mono text-ink-faint">12 mois</span>
                </li>
              </ul>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={acknowledge}
                className="inline-flex min-h-9 items-center gap-1.5 border-2 border-ink bg-ink px-3.5 text-xs font-semibold text-cream shadow-[2px_2px_0_var(--navy)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_var(--navy)]"
              >
                Compris
              </button>
              <button
                type="button"
                onClick={() => setShowDetails((value) => !value)}
                className="inline-flex min-h-9 items-center gap-1.5 border-2 border-ink bg-cream px-3 text-xs font-semibold text-ink shadow-[2px_2px_0_var(--ink)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_var(--ink)]"
              >
                <Settings2 size={12} strokeWidth={2.5} />
                {showDetails ? 'Masquer le détail' : 'Voir le détail'}
              </button>
              <Link
                href="/cookies"
                className="ml-auto text-xs font-semibold text-navy underline decoration-ink/30 underline-offset-2 hover:decoration-navy"
              >
                Politique complète
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={acknowledge}
            aria-label="Fermer le bandeau cookies"
            className="grid h-7 w-7 shrink-0 place-items-center text-ink-soft transition-colors hover:text-ink"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-3 block w-full text-left text-[10px] uppercase tracking-widest text-ink-faint hover:text-ink"
        >
          Réinitialiser mes préférences cookies
        </button>
      </div>
    </div>
  )
}
