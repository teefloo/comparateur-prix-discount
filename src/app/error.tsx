'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl dark:bg-red-900/20 dark:border-red-800">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 dark:text-slate-100">Une erreur est survenue</h2>
        <p className="text-muted text-sm mb-8 dark:text-slate-400">
          {error.message || "La page n&apos;a pas pu être chargée. Veuillez réessayer."}
        </p>
        <button onClick={reset} className="btn-primary">
          Réessayer
        </button>
      </div>
    </div>
  )
}
