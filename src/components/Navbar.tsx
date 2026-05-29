'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Tag } from 'lucide-react'

import { useTheme } from './ThemeProvider'
import Logo from './Logo'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
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
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? 'border-line/80 bg-paper/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 py-3 sm:h-[4.5rem] sm:px-6">
        <Logo withText className="shrink-0" />

        <nav className="flex items-center gap-2" aria-label="Navigation principale">
          <Link href="/deals" className={`nav-pill ${isActive('/deals') ? 'nav-pill-active' : ''}`}>
            <Tag size={14} />
            <span className="hidden sm:inline">Bons plans</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="nav-pill min-w-10 justify-center px-3"
            aria-label="Changer le thème"
            type="button"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </nav>
      </div>
    </header>
  )
}
