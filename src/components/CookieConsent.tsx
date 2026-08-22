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
      aria-modal="false"
      aria-label="Information sur les cookies"
      className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md"
    >
      <div className="surface-elevated rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-accent-soft text-navy"
            aria-hidden
          >
            <Cookie size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight text-ink">Cookies — version courte</p>
            <p className="editorial mt-1.5 text-sm leading-relaxed text-ink-soft">
              ComparPrix utilise uniquement le stockage local de votre navigateur pour mémoriser
              votre thème (clair / sombre). Aucun cookie publicitaire, aucun tracker tiers, aucune
              mesure d&apos;audience.
            </p>

            {showDetails ? (
              <ul className="mt-3 space-y-1.5 border-t border-ink/15 pt-3 text-xs text-ink-soft">
                <li className="flex justify-between gap-3 border-t border-border pt-1.5 first:border-0 first:pt-0">
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
                className="btn-primary inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3.5 text-xs"
              >
                Compris
              </button>
              <button
                type="button"
                onClick={() => setShowDetails((value) => !value)}
                className="btn-secondary inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs"
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-3 block min-h-11 w-full text-left text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-ink"
        >
          Réinitialiser mes préférences cookies
        </button>
      </div>
    </div>
  )
}
