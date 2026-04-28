'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingBag, Info, Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Logo from './Logo'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Catégories', href: '#categories', icon: ShoppingBag },
    { name: 'À propos', href: '/a-propos', icon: Info },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-800'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Logo />

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors relative group dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
                </Link>
              ))}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-slate-100 transition-all dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                aria-label="Changer le thème"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <a
                href="https://github.com/teefloo/comparateur-prix-discount" target="_blank" rel="noopener noreferrer"
                className="btn-primary text-sm px-5 py-2.5 inline-block"
              >
                Contribuer
              </a>
            </div>

            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-slate-100 transition-all dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                aria-label="Changer le thème"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                className="p-2 text-muted hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="md:hidden border-t border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
              id="mobile-menu"
            >
              <div className="px-6 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-foreground hover:bg-slate-50 font-medium transition-all dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <link.icon size={18} />
                    {link.name}
                  </Link>
                ))}
                <hr className="border-slate-100 dark:border-slate-800 my-2" />
                <a
                  href="https://github.com/teefloo/comparateur-prix-discount" target="_blank" rel="noopener noreferrer"
                  className="block w-full btn-primary text-center py-3.5"
                >
                  Contribuer
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {[
            { icon: ShoppingBag, label: 'Catégories', href: '#categories' },
            { icon: Info, label: 'À propos', href: '/a-propos' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1 text-muted hover:text-accent transition-colors dark:text-slate-400 dark:hover:text-accent"
            >
              <item.icon size={20} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
