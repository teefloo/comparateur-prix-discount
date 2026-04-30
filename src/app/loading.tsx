export default function Loading() {
  return (
    <div className="min-h-screen bg-paper px-4 py-24 dark:bg-slate-950">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
        <div className="space-y-3">
          <p className="section-label">Chargement</p>
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground dark:text-slate-100">
            Préparation de l&apos;espace de comparaison
          </p>
          <p className="support-copy">
            Les résultats et les filtres se remettent en place pendant que la recherche se charge.
          </p>
        </div>
      </div>
    </div>
  )
}
