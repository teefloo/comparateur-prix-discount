'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, Info, Menu, Moon, ShoppingBag, Sun, Tag, X } from 'lucide-react'

import { useTheme } from './ThemeProvider'
import Logo from './Logo'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? 'border-line/80 bg-paper/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 py-3 sm:h-[4.5rem] sm:px-6">
          <Logo withText className="shrink-0" />

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/#categories" className="nav-pill">
              <ShoppingBag size={14} />
              Catégories
            </Link>
            <Link href="/deals" className={`nav-pill ${isActive('/deals') ? 'nav-pill-active' : ''}`}>
              <Tag size={14} />
              Bons plans
            </Link>
            <Link href="/a-propos" className={`nav-pill ${isActive('/a-propos') ? 'nav-pill-active' : ''}`}>
              À propos
            </Link>
            <button
              onClick={toggleTheme}
              className="nav-pill min-w-10 justify-center"
              aria-label="Changer le thème"
              type="button"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <a
              href="https://github.com/teefloo/comparateur-prix-discount"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
            >
              Contribuer
            </a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="nav-pill min-w-10 justify-center px-3"
              aria-label="Changer le thème"
              type="button"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="nav-pill min-w-10 justify-center px-3"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="border-t border-line bg-paper/96 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
              id="mobile-menu"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
                <Link
                  href="/#categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="surface flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground dark:text-slate-100"
                >
                  <ShoppingBag size={16} className="text-accent" />
                  Catégories
                </Link>
                <Link
                  href="/deals"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="surface flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground dark:text-slate-100"
                >
                  <Tag size={16} className="text-accent" />
                  Bons plans
                </Link>
                <Link
                  href="/a-propos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="surface px-4 py-3 text-sm font-medium text-foreground dark:text-slate-100"
                >
                  À propos
                </Link>
                <a
                  href="https://github.com/teefloo/comparateur-prix-discount"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-foreground px-4 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                >
                  Contribuer
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-paper/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 md:hidden safe-area-bottom">
        <div className="mx-auto grid max-w-7xl grid-cols-4 px-4 py-2">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-colors ${
              isActive('/')
                ? 'text-accent'
                : 'text-muted dark:text-slate-400 hover:text-foreground dark:hover:text-slate-100'
            }`}
          >
            <Home size={16} />
            <span className="text-[11px] font-semibold">Accueil</span>
          </Link>
          <Link
            href="/#categories"
            className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-muted transition-colors hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ShoppingBag size={16} />
            <span className="text-[11px] font-semibold">Catégories</span>
          </Link>
          <Link
            href="/deals"
            className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-colors ${
              isActive('/deals')
                ? 'text-accent'
                : 'text-muted dark:text-slate-400 hover:text-foreground dark:hover:text-slate-100'
            }`}
          >
            <Tag size={16} />
            <span className="text-[11px] font-semibold">Bons plans</span>
          </Link>
          <Link
            href="/a-propos"
            className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-colors ${
              isActive('/a-propos')
                ? 'text-accent'
                : 'text-muted dark:text-slate-400 hover:text-foreground dark:hover:text-slate-100'
            }`}
          >
            <Info size={16} />
            <span className="text-[11px] font-semibold">À propos</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
