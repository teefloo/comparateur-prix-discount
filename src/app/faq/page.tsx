import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { absoluteUrl } from '@/lib/site'

const FAQ_DESCRIPTION =
  "Comparateur de prix discount : 15 réponses sur le fonctionnement, les enseignes suivies, la fiabilité et l'indépendance éditoriale."

const FAQ_OG_DESCRIPTION =
  "15 réponses sur le comparateur de prix discount : fonctionnement, enseignes (Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar, Noz), fréquence de mise à jour hebdomadaire, indépendance éditoriale et RGPD."

const FAQ_LAST_REVIEWED = '2026-06-01'

export const metadata: Metadata = {
  title: 'FAQ',
  description: FAQ_DESCRIPTION,
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ | ComparPrix',
    description: FAQ_OG_DESCRIPTION,
    type: 'website',
    locale: 'fr_FR',
    url: absoluteUrl('/faq'),
    siteName: 'ComparPrix',
    images: [{ url: '/brand/comparprix-social.svg', width: 1200, height: 630, alt: 'ComparPrix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | ComparPrix',
    description: FAQ_OG_DESCRIPTION,
    images: ['/brand/comparprix-social.svg'],
  },
  other: {
    robots: 'index, follow',
    'article:modified_time': FAQ_LAST_REVIEWED,
  },
}

type FAQ = {
  q: string
  a: string
  link?: { href: string; label: string }
}

type Category = {
  id: string
  category: string
  blurb: string
  questions: FAQ[]
}

const faqs: Category[] = [
  {
    id: 'recherche-navigation',
    category: 'Recherche & Navigation',
    blurb: 'Trouver un produit, filtrer, comparer les prix au kilo.',
    questions: [
      {
        q: 'Comment rechercher un produit sur ComparPrix ?',
        a: 'Tapez le nom du produit dans la barre de recherche (ex. "lessive", "café", "serviettes"). Le comparateur interroge <strong>10 enseignes discount</strong> en un seul coup d\'œil. Filtrez par catégorie, enseigne ou fourchette de prix pour affiner. Aucun compte ni cookie requis.',
      },
      {
        q: 'Puis-je filtrer les résultats par enseigne ou catégorie ?',
        a: 'Oui. Après une recherche, utilisez les filtres latéraux : choisissez une ou plusieurs enseignes (Action, Lidl, GiFi…), une catégorie (alimentation, hygiène, maison-déco…) et définissez un prix min/max. Le tri par prix croissant ou décroissant est aussi disponible, ainsi qu\'un tri par pertinence.',
      },
      {
        q: 'Que signifie "Prix au kilo / litre / unité" affiché sur les fiches ?',
        a: 'C\'est le prix normalisé pour comparer à volume égal entre enseignes. Exemple : une lessive de 1,5 L à 4,50 € devient 3,00 €/L. Le comparateur calcule automatiquement ce ratio depuis la quantité et le prix unitaire fournis par chaque enseigne dans son catalogue.',
      },
    ],
  },
  {
    id: 'prix-promotions',
    category: 'Prix & Promotions',
    blurb: 'Fréquence de mise à jour, fiabilité des prix barrés, garantie magasin.',
    questions: [
      {
        q: 'Les prix affichés sont-ils garantis en magasin ?',
        a: 'Les prix proviennent du scraping hebdomadaire des sites officiels des 10 enseignes. Ils reflètent le prix "web" au moment de la collecte. En magasin, le prix peut varier selon le point de vente, les stocks ou les promos locales. Vérifiez toujours en rayon.',
      },
      {
        q: 'À quelle fréquence les prix sont-ils mis à jour ?',
        a: 'Une collecte complète s\'exécute chaque semaine (généralement le lundi). Les 6 enseignes "requises" (Action, Stokomani, B&M, Centrakor, Aldi, GiFi) sont scrapées jusqu\'à 3 fois en cas d\'échec. Les 4 "optionnelles" (La Foir\'Fouille, Lidl, Maxi Bazar, Noz) font l\'objet d\'une seule tentative.',
      },
      {
        q: 'Comment repérer les vraies promotions ?',
        a: 'Les fiches indiquent "En promo" avec le prix barré d\'origine et le % de réduction quand l\'enseigne communique un prix de référence. Méfiance : certains "prix barrés" sont des prix conseillés, pas le prix habituel. ComparPrix affiche ce que l\'enseigne publie.',
      },
    ],
  },
  {
    id: 'enseignes-couverture',
    category: 'Enseignes & Couverture',
    blurb: 'Les 10 enseignes suivies, marques distributeurs, et cas d\'enseignes manquantes.',
    questions: [
      {
        q: 'Quelles enseignes sont comparées exactement ?',
        a: '10 enseignes discount françaises : <strong>Action, Stokomani, B&amp;M, Centrakor, Aldi, GiFi, La Foir\'Fouille, Lidl, Maxi Bazar, Noz</strong>. Chacune a son propre scraper (Playwright pour 4, API/JSON pour 6). La liste évolue si de nouvelles enseignes ouvrent des données exploitables publiquement.',
      },
      {
        q: 'Pourquoi une enseigne manque-t-elle parfois dans les résultats ?',
        a: 'Trois causes principales : (1) le scraper a échoué cette semaine (site bloqué, structure changée), (2) l\'enseigne ne référence pas le produit recherché dans son catalogue, (3) l\'enseigne est "optionnelle" et sa collecte a été tolérée en échec. L\'indicateur de source signale l\'état.',
      },
      {
        q: 'Les marques distributeurs (MDD) sont-elles comparées ?',
        a: 'Oui, quand l\'enseigne les expose sur son site. Exemple : "Marque Repère" (E.Leclerc) n\'est pas dans notre périmètre, mais "Toutes les Marques" (Action) ou "Cien" (Lidl) le sont. La comparaison porte sur le libellé exact affiché par l\'enseigne, sans rapprochement automatique entre MDD différentes.',
      },
    ],
  },
  {
    id: 'fiabilite-independance',
    category: 'Fiabilité & Indépendance',
    blurb: 'Indépendance éditoriale, absence de publicité, signalement d\'erreurs.',
    questions: [
      {
        q: 'ComparPrix est-il payé par les enseignes pour mieux les classer ?',
        a: 'Non. Aucun accord commercial, aucune commission, aucun placement payant. Le tri par défaut est "prix croissant" (le moins cher en premier). L\'indépendance éditoriale est le principe fondateur : "Le Bulletin des Prix Discount", pas un catalogue publicitaire, ni un comparatif sponsorisé.',
        link: { href: '/a-propos', label: 'Lire le manifeste éditorial' },
      },
      {
        q: 'Y a-t-il des publicités ou trackers sur le site ?',
        a: 'Zéro publicité, zéro tracker tiers, zéro cookie marketing. Seul un cookie technique (consentement RGPD) est déposé. L\'hébergement est sur Vercel, la base sur Vercel Postgres. Le modèle est bénévole/associatif : les coûts d\'infrastructure sont couverts par des dons si besoin.',
      },
      {
        q: 'Comment signaler un prix erroné ou un produit manquant ?',
        a: 'Utilisez le formulaire de contact (page "Mentions légales") en précisant : enseigne, nom exact du produit, prix affiché chez nous, prix réel constaté, date et magasin si possible. Nous corrigeons au prochain cycle hebdomadaire, ou plus vite en cas d\'erreur critique sur un produit phare.',
        link: { href: '/mentions-legales', label: 'Nous écrire' },
      },
    ],
  },
  {
    id: 'technique-donnees',
    category: 'Technique & Données',
    blurb: 'API, export, rendu sans JavaScript, protection des données.',
    questions: [
      {
        q: 'Puis-je exporter les résultats ou utiliser l\'API ?',
        a: 'Pas d\'API publique documentée pour l\'instant. L\'endpoint <strong>/api/search</strong> sert le front interne du site. Un flux JSON brut des deals hebdomadaires est accessible via <strong>/api/deals</strong> (usage personnel toléré, pas de revente commerciale). Pour un usage professionnel, merci de nous contacter.',
      },
      {
        q: 'Le site fonctionne-t-il sur mobile et sans JavaScript ?',
        a: 'Oui. Le rendu est entièrement côté serveur (Next.js App Router avec Server Components). La recherche, les filtres et l\'affichage des fiches fonctionnent sans JS. Le JavaScript n\'apporte que l\'interactivité (tri instantané, accordéons). L\'expérience reste complète en navigation "no-script", y compris sur mobile.',
      },
      {
        q: 'Comment sont protégées mes données personnelles ?',
        a: 'Aucune donnée personnelle n\'est collectée : pas de compte, pas de formulaire d\'inscription, pas d\'analytics tiers. Le seul traitement est le cookie de consentement RGPD (durée 6 mois). Voir la page "Politique de confidentialité" pour le détail des droits et la procédure d\'accès.',
        link: { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
      },
    ],
  },
]

function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    dateModified: FAQ_LAST_REVIEWED,
    mainEntity: faqs.flatMap((cat) =>
      cat.questions.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: a,
        },
      }))
    ),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function BreadcrumbSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FAQ',
        item: absoluteUrl('/faq'),
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

const formattedDate = new Date(FAQ_LAST_REVIEWED).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function FAQPage() {
  return (
    <>
      <FAQSchema />
      <BreadcrumbSchema />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-12 lg:px-8">
        <header className="mb-10 max-w-3xl border-b pb-8">
          <p className="meta-label">Questions fréquentes</p>
          <h1 className="display-xl mt-3 text-balance">Tout comprendre sur ComparPrix.</h1>
          <p className="mt-5 text-base leading-7 text-ink-soft text-pretty">
            Le Bulletin des Prix Discount répond à vos questions sur le fonctionnement, la fiabilité, les enseignes couvertes et l&apos;indépendance du comparateur.
          </p>
          <p className="mt-6 font-mono text-xs text-ink-faint">
            <time dateTime={FAQ_LAST_REVIEWED}>Mis à jour le {formattedDate}</time>
            <span aria-hidden="true"> | </span>
            15 questions | 5 catégories
          </p>
        </header>

        <nav className="mb-10 overflow-x-auto pb-4" aria-label="Sommaire FAQ par catégorie">
          <ol className="flex min-w-max gap-2 text-sm font-medium">
            {faqs.map((cat) => (
              <li key={cat.id}>
                <a
                  href={`#${cat.id}`}
                  className="inline-flex min-h-10 items-center rounded-full border bg-cream px-4 py-2 transition-colors hover:border-navy hover:text-navy"
                >
                  <span>{cat.category}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {faqs.map((cat) => (
            <section
              key={cat.id}
              id={cat.id}
              aria-labelledby={`${cat.id}-title`}
              className="border-b py-10 first:border-t"
            >
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                <h2
                  id={`${cat.id}-title`}
                  className="text-2xl font-semibold tracking-tight text-ink"
                >
                  {cat.category}
                </h2>
                <p className="max-w-sm text-sm leading-6 text-ink-soft sm:text-right">{cat.blurb}</p>
              </div>

              <dl className="divide-y">
                {cat.questions.map(({ q, a, link }, qIndex) => (
                  <div key={q}>
                    <details className="group" open={qIndex === 0}>
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                        <h3 className="flex-1 pr-4 text-lg font-semibold leading-tight text-ink text-balance">
                          {q}
                        </h3>
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-ink-soft transition-transform group-open:rotate-45"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </summary>
                      <div className="pb-5 pr-12">
                        <p
                          className="text-sm leading-6 text-ink-soft text-pretty"
                          dangerouslySetInnerHTML={{ __html: a }}
                        />
                        {link && (
                          <Link
                            href={link.href}
                            className="mt-3 inline-flex items-center gap-1 mono text-xs font-bold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
                          >
                            {link.label}
                            <span aria-hidden="true">→</span>
                          </Link>
                        )}
                      </div>
                    </details>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section className="surface-elevated p-8 text-center sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Une question sans réponse ?</h2>
            <p className="mx-auto mb-6 mt-4 max-w-xl text-sm leading-6 text-ink-soft">
              Consultez les mentions légales ou écrivez-nous. Nous répondons sous 48 h ouvrées et enrichissons cette FAQ avec vos retours.
            </p>
            <Link
              href="/mentions-legales"
              className="btn-primary inline-flex min-h-11 items-center gap-2 px-6 text-sm"
            >
              Nous contacter
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}
