'use client'

import { AlertTriangle } from 'lucide-react'

import Navbar from '@/components/Navbar'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-4rem)] bg-canvas px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="surface-elevated rounded-xl p-6 sm:p-9">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-danger/30 bg-danger/10 text-danger">
              <AlertTriangle size={22} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="meta-label">Erreur temporaire</p>
              <h1 className="display-lg mt-2 text-balance">Une erreur est survenue.</h1>
              <p className="mt-3 text-base leading-7 text-ink-soft text-pretty">
                {error.message || "La page n'a pas pu être composée. Réessayez dans un instant."}
              </p>
            </div>
          </div>

          {error.digest && (
            <p className="mono mt-6 text-xs text-ink-faint">Réf. incident : {error.digest}</p>
          )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={reset} className="btn-primary inline-flex min-h-11 items-center rounded-lg px-5 text-sm">
              Réessayer
            </button>
            <a href="/" className="btn-secondary inline-flex min-h-11 items-center rounded-lg px-5 text-sm">
              Retour à la une
            </a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
