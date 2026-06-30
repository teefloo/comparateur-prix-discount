'use client'

import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-paper pt-32 pb-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="eyebrow text-ink-faint">№ 503 — Édition interrompue</span>
          <span className="dotline h-px flex-1 bg-ink/30" />
        </div>

        <div className="ticket paper-shadow p-7 sm:p-9">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center border-2 border-ink bg-yellow text-ink shadow-[3px_3px_0_var(--ink)]">
              <AlertTriangle size={22} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="display-md text-3xl text-ink sm:text-4xl">Une erreur est survenue.</h1>
              <p className="editorial mt-3 text-lg leading-snug text-ink-soft text-pretty">
                {error.message || "La page n'a pas pu être composée. Réessayez dans un instant."}
              </p>
            </div>
          </div>

          {error.digest && (
            <p className="mono mt-6 text-xs text-ink-faint">Réf. incident : {error.digest}</p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={reset} className="btn-ink inline-flex h-11 items-center px-5 text-sm">
              Réessayer
            </button>
            <a href="/" className="btn-paper inline-flex h-11 items-center px-5 text-sm">
              Retour à la une
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
