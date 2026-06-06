export default function Loading() {
  return (
    <div className="min-h-screen bg-paper pt-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="eyebrow text-ink-faint">№ 01 — Sous presse</span>
          <span className="dotline h-px flex-1 bg-ink/30" />
        </div>
        <div className="display-huge text-ink">
          <span className="block">Composition</span>
          <span className="block text-navy stamp-rotate-1">en cours.</span>
        </div>
        <p className="editorial mt-5 text-2xl text-ink-soft">
          Le Bulletin met en page les pages que vous avez demandées. Encore un instant.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <div className="h-2 w-2 animate-pulse-navy rounded-full bg-navy" />
          <span className="eyebrow text-ink-faint">Encrage en cours</span>
        </div>
      </div>
    </div>
  )
}
