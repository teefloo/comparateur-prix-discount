import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { LEGAL_PAGES, type LegalPageSlug } from '@/lib/legal'
import { cn } from '@/lib/utils'

type LegalSection = {
  id: string
  number: string
  title: string
}

type LegalLayoutProps = {
  pageSlug: LegalPageSlug
  eyebrow: string
  title: string
  intro: React.ReactNode
  lastUpdated: string
  effectiveDate: string
  sections: LegalSection[]
  children: React.ReactNode
}

export default function LegalLayout({
  pageSlug,
  eyebrow,
  title,
  intro,
  lastUpdated,
  effectiveDate,
  sections,
  children,
}: LegalLayoutProps) {
  return (
    <>
      <Navbar />

      <section className="border-b border-border bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Retour à l&apos;accueil
          </Link>

          <p className="meta-label mt-8">{eyebrow}</p>

          <h1 className="display-xl mt-3 max-w-4xl text-balance">
            {title}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-ink-soft text-pretty">
            {intro}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-5 sm:max-w-md sm:gap-10">
            <div>
              <dt className="meta-label">Mis à jour</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{lastUpdated}</dd>
            </div>
            <div>
              <dt className="meta-label">En vigueur</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{effectiveDate}</dd>
            </div>
          </dl>
        </div>
      </section>

      <main className="border-b border-border bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="meta-label">Sommaire</p>
            <nav aria-label="Sommaire de la page" className="mt-4 flex flex-col gap-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex min-h-11 items-baseline gap-2 border-l border-border pl-3 py-2 text-sm text-ink-soft transition-colors hover:border-navy hover:text-navy"
                >
                  <span className="font-mono text-[10px] font-semibold text-ink-faint group-hover:text-navy">
                    {section.number}
                  </span>
                  <span className="leading-tight">{section.title}</span>
                </a>
              ))}
            </nav>

            <div className="mt-8 hidden lg:block">
              <p className="meta-label">Voir aussi</p>
              <ul className="mt-3 flex flex-col gap-2">
                {LEGAL_PAGES.filter((page) => page.slug !== pageSlug).map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/${page.slug}`}
                      className="group inline-flex min-h-11 items-start gap-1.5 py-2 text-sm text-ink-soft underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-navy hover:text-navy"
                    >
                      <span className="leading-snug">{page.title}</span>
                      <ArrowUpRight
                        size={12}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 transition-transform group-hover:rotate-45"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article className="legal-prose min-w-0">
            {children}
            <LegalFooterNav currentSlug={pageSlug} />
          </article>
        </div>
      </main>
    </>
  )
}

function LegalFooterNav({ currentSlug }: { currentSlug: LegalPageSlug }) {
  return (
    <nav
      aria-label="Navigation entre les pages légales"
      className="mt-16 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
    >
      {LEGAL_PAGES.filter((page) => page.slug !== currentSlug).map((page) => (
        <Link
          key={page.slug}
          href={`/${page.slug}`}
          className="surface group flex min-h-24 items-start justify-between gap-3 rounded-xl p-4 transition-colors hover:border-navy"
        >
          <div>
            <p className="text-base font-semibold text-ink group-hover:text-navy">{page.title}</p>
            <p className="meta-label mt-1">{page.short}</p>
          </div>
          <ArrowUpRight
            size={16}
            className="mt-1 shrink-0 text-ink-soft transition-colors group-hover:text-navy"
          />
        </Link>
      ))}
    </nav>
  )
}

type LegalCalloutProps = {
  variant?: 'warning' | 'info'
  title?: string
  children: React.ReactNode
  className?: string
}

export function LegalCallout({ variant = 'info', title, children, className }: LegalCalloutProps) {
  return (
    <aside
      className={cn(
        'my-6 rounded-xl border p-4',
        variant === 'warning' ? 'border-warning/30 bg-warning/10' : 'border-border bg-surface',
        className,
      )}
    >
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy">{title}</p>
      ) : null}
      <div className="mt-2 text-sm leading-6 text-ink [&_a]:underline [&_a]:decoration-border-strong [&_a]:underline-offset-2 hover:[&_a]:decoration-navy hover:[&_a]:text-navy">
        {children}
      </div>
    </aside>
  )
}
