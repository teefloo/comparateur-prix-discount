'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleHelp, Info, Moon, Sun, Tag } from 'lucide-react'

import { useTheme } from './ThemeProvider'
import Logo from './Logo'

const links = [
  { href: '/deals', label: 'Bons plans', icon: Tag },
  { href: '/a-propos', label: 'À propos', icon: Info },
  { href: '/faq', label: 'FAQ', icon: CircleHelp },
]

export default function Navbar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white focus:not-sr-only"
      >
        Aller au contenu
      </a>
      <header className="sticky top-0 z-40 border-b bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <span className="shrink-0 sm:hidden">
            <Logo withText={false} size={34} />
          </span>
          <span className="hidden shrink-0 sm:block">
            <Logo size={34} />
          </span>

          <nav className="flex items-center gap-1" aria-label="Navigation principale">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)

              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors sm:px-3.5 ${
                    isActive
                      ? 'bg-navy/10 text-navy'
                      : 'text-ink-soft hover:bg-paper-2 hover:text-ink'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
            <button
              onClick={toggleTheme}
              className="ml-1 grid h-11 w-11 place-items-center rounded-lg border bg-cream text-ink-soft transition-colors hover:border-navy hover:text-navy"
              aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
              type="button"
            >
              {theme === 'dark' ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
            </button>
          </nav>
        </div>
      </header>
    </>
  )
}
