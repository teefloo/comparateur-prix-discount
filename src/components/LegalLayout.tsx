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

      <section className="relative border-b-2 border-ink bg-cream pt-32 pb-12">
        <div className="absolute inset-0 -z-10 grain" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour à l&apos;accueil
          </Link>

          <div className="mt-8 flex items-center gap-3">
            <span className="eyebrow text-ink-faint">№ Legal — {eyebrow}</span>
            <span className="dotline h-px w-12 bg-ink/30" />
          </div>

          <h1 className="display-huge mt-4 text-fluid-section text-ink text-balance">
            {title}
          </h1>

          <p className="editorial mt-6 text-lg leading-relaxed text-ink-soft max-w-3xl text-pretty">
            {intro}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="border-2 border-ink bg-cream p-3 shadow-[3px_3px_0_var(--ink)]">
              <dt className="eyebrow text-ink-faint">Mis à jour</dt>
              <dd className="editorial mt-1 text-base text-ink">{lastUpdated}</dd>
            </div>
            <div className="border-2 border-ink bg-cream p-3 shadow-[3px_3px_0_var(--ink)]">
              <dt className="eyebrow text-ink-faint">En vigueur</dt>
              <dd className="editorial mt-1 text-base text-ink">{effectiveDate}</dd>
            </div>
          </dl>
        </div>
      </section>

      <main className="border-b-2 border-ink bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow text-ink-faint">Sommaire</p>
            <nav aria-label="Sommaire de la page" className="mt-4 flex flex-col gap-1.5">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-baseline gap-2 border-l-2 border-ink/15 pl-3 py-1 text-sm text-ink-soft transition-colors hover:border-navy hover:text-navy"
                >
                  <span className="mono text-[10px] font-bold text-ink-faint group-hover:text-navy">
                    {section.number}
                  </span>
                  <span className="editorial leading-tight">{section.title}</span>
                </a>
              ))}
            </nav>

            <div className="mt-8 hidden lg:block">
              <p className="eyebrow text-ink-faint">Voir aussi</p>
              <ul className="mt-3 flex flex-col gap-2">
                {LEGAL_PAGES.filter((page) => page.slug !== pageSlug).map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/${page.slug}`}
                      className="group inline-flex items-start gap-1.5 text-sm text-ink-soft underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy"
                    >
                      <span className="leading-snug">{page.title}</span>
                      <ArrowUpRight
                        size={12}
                        strokeWidth={2.5}
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
      className="mt-16 grid gap-3 border-t-2 border-ink pt-8 sm:grid-cols-2"
    >
      {LEGAL_PAGES.filter((page) => page.slug !== currentSlug).map((page) => (
        <Link
          key={page.slug}
          href={`/${page.slug}`}
          className="group flex items-start justify-between gap-3 border-2 border-ink bg-cream p-4 shadow-[3px_3px_0_var(--ink)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_var(--ink)]"
        >
          <div>
            <p className="editorial text-lg text-ink group-hover:text-navy">{page.title}</p>
            <p className="eyebrow text-ink-faint mt-1">{page.short}</p>
          </div>
          <ArrowUpRight
            size={16}
            className="mt-1 shrink-0 text-ink-soft transition-transform group-hover:rotate-45 group-hover:text-navy"
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
        'my-6 border-2 border-ink p-4 shadow-[3px_3px_0_var(--ink)]',
        variant === 'warning' ? 'bg-paper' : 'bg-cream',
        className,
      )}
    >
      {title ? (
        <p className="display-md text-xs uppercase tracking-widest text-navy">{title}</p>
      ) : null}
      <div className="editorial mt-2 text-sm leading-relaxed text-ink [&_a]:underline [&_a]:decoration-ink/30 [&_a]:underline-offset-2 hover:[&_a]:decoration-navy hover:[&_a]:text-navy">
        {children}
      </div>
    </aside>
  )
}
