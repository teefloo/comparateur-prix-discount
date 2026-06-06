'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Tag } from 'lucide-react'

import { useTheme } from './ThemeProvider'
import Logo from './Logo'

const EDITION_LABELS = [
  'Édition Discount',
  '10 enseignes scrutées',
  'Mise à jour hebdomadaire',
  'Bons plans garantis',
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [dateLabel] = useState(() =>
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  )
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-ink/40 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <span className="eyebrow text-ink-faint">№ 01</span>
          <span className="dotline h-px flex-1 bg-ink/30" />
          <span className="eyebrow hidden text-ink-faint sm:inline">{dateLabel}</span>
          <span className="hidden h-3 w-px bg-ink/30 sm:inline-block" />
          <span className="eyebrow text-navy">10 ENSEIGNES</span>
        </div>
      </div>

      <div
        className={`border-b-2 border-ink transition-all duration-300 ${
          isScrolled ? 'bg-cream/90 shadow-[0_2px_0_var(--ink)] backdrop-blur-md' : 'bg-cream'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6">
          <Logo className="shrink-0" />

          <nav className="flex items-center gap-2" aria-label="Navigation principale">
            <Link
              href="/deals"
              className={`group inline-flex items-center gap-2 border-2 px-3.5 py-2 text-sm font-semibold transition-all ${
                pathname === '/deals'
                  ? 'border-ink bg-ink text-cream'
                  : 'border-ink bg-cream text-ink shadow-[3px_3px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-ink hover:text-cream hover:shadow-[5px_5px_0_var(--ink)]'
              }`}
            >
              <Tag size={14} />
              <span className="hidden sm:inline">Bons plans</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center border-2 border-ink bg-cream text-ink shadow-[3px_3px_0_var(--ink)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-ink hover:text-cream hover:shadow-[5px_5px_0_var(--ink)]"
              aria-label="Changer le thème"
              type="button"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </nav>
        </div>
      </div>

      <div className="overflow-hidden border-b border-ink/40 bg-ink text-cream">
        <div className="flex animate-marquee whitespace-nowrap py-2">
          {[...EDITION_LABELS, ...EDITION_LABELS, ...EDITION_LABELS].map((label, index) => (
            <div key={`${label}-${index}`} className="flex items-center gap-6 px-6">
              <span className="display-md text-sm">★</span>
              <span className="eyebrow">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
