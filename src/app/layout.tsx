import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google'
import { Agentation } from 'agentation'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-body'
})

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-heading'
})

export const metadata: Metadata = {
  title: 'ComparPrix | Votre assistant shopping intelligent',
  description: 'Trouvez les meilleurs prix en hygiène, alimentation et ménage chez Action, Stokomani, B&M, Centrakor et Aldi. Ne payez plus jamais trop cher.',
  openGraph: {
    title: 'ComparPrix | Assistant Shopping Intelligent',
    description: 'Le comparateur de prix n°1 pour Action, Stokomani, B&M, Centrakor et Aldi.',
    type: 'website',
    locale: 'fr_FR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${plusJakarta.variable} ${outfit.variable}`}>
       <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="font-body bg-slate-50 text-slate-900 antialiased selection:bg-brand-orange selection:text-white">
        <main className="min-h-screen relative">{children}</main>
        {process.env.NODE_ENV === 'development' ? <Agentation /> : null}
        <footer className="bg-slate-950 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="font-heading text-2xl font-bold mb-4 italic">
                  <span className="text-brand-orange">Compar</span>Prix
                </h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Le comparateur intelligent pour vos enseignes de discount préférées. Mise à jour hebdomadaire pour des économies maximales.
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-slate-500 text-xs">
                  Les prix sont indicatifs et peuvent varier selon les magasins.
                </p>
                <div className="mt-4 flex gap-4 md:justify-end text-xs text-slate-400">
                  <a href="/" className="hover:text-brand-orange transition-colors">Accueil</a>
                  <a href="#about" className="hover:text-brand-orange transition-colors">Mentions Légales</a>
                  <a href="mailto:contact@comparprix.fr" className="hover:text-brand-orange transition-colors">Contact</a>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-900 mt-12 pt-8 text-center text-slate-500 text-xs">
              © {new Date().getFullYear()} ComparPrix. Fait avec passion pour votre pouvoir d&apos;achat.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
