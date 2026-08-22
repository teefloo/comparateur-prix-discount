import Navbar from '@/components/Navbar'

export default function Loading() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-4rem)] bg-canvas px-4 py-16 sm:px-6 sm:py-24" aria-busy="true">
        <div className="mx-auto max-w-3xl">
          <p className="meta-label">Chargement</p>
          <h1 className="display-lg mt-3 max-w-xl text-balance">Préparation des résultats.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
            Les données arrivent. Cette page se met à jour automatiquement.
          </p>
          <div className="mt-10 space-y-3" aria-hidden="true">
            <div className="h-3 w-32 rounded-full bg-surface-strong" />
            <div className="h-10 max-w-xl rounded-lg border border-border bg-surface" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-32 rounded-xl border border-border bg-surface" />
              <div className="h-32 rounded-xl border border-border bg-surface" />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
