'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-paper px-4 py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-lg">
        <div className="surface px-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-danger/20 bg-danger/10 text-danger dark:border-danger/30 dark:bg-danger/10">
            <span aria-hidden="true">⚠️</span>
          </div>
          <h2 className="font-display mt-6 text-3xl font-semibold tracking-tight text-foreground dark:text-slate-100">
            Une erreur est survenue
          </h2>
          <p className="support-copy mt-3">
            {error.message || "La page n'a pas pu être chargée. Veuillez réessayer."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  )
}
