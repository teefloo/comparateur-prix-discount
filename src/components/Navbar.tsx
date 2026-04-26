'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingBag, Info, Menu, X } from 'lucide-react'
import Logo from './Logo'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Accueil', href: '/', icon: Search },
    { name: 'Catégories', href: '#categories', icon: ShoppingBag },
    { name: 'À propos', href: '#about', icon: Info },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`transition-all duration-300 rounded-2xl ${isScrolled ? 'glass px-6 py-3 shadow-lg' : 'px-0 py-0 shadow-none'}`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Logo />

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-orange transition-all group-hover:w-full" />
                </Link>
              ))}
              <a 
                href="https://github.com" 
                target="_blank" 
                className="bg-brand-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                Contribuer
              </a>
            </div>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 glass mt-2 mx-6 p-6 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream text-slate-700 hover:text-brand-orange font-medium transition-all"
                >
                  <link.icon size={18} />
                  {link.name}
                </Link>
              ))}
              <hr className="border-slate-100" />
              <button className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-orange/20">
                Lancer une recherche
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

