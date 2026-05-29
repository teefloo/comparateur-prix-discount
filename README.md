# Comparateur de Prix Discount

Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.

## Stack

- Next.js 16 App Router
- Tailwind CSS
- Vercel Postgres / PostgreSQL
- Playwright et Cheerio pour le scraping
- Fuse.js pour la recherche

## Fonctionnement

- La page d'accueil compare les offres en base avec fallback de recherche si nécessaire.
- La section [Bons plans](/deals) affiche uniquement les offres promotionnelles persistées en base.
- Le scraping live est réservé aux scripts d'exploitation et aux jobs planifiés, pas au rendu utilisateur de la section Bons plans.

## Installation

```bash
npm install
npx playwright install chromium
```

## Développement

```bash
npm run dev
```

## Vérifications

```bash
npm run lint
npm run typecheck
npm run test:categories
```

## Base de données

Variables d'environnement principales :

- `POSTGRES_URL`
- `DATABASE_URL` comme alias accepté

Le schéma principal est composé de :

- `products` pour les métadonnées d'offres
- `prices` pour l'état courant du prix, du prix d'origine, de la remise et du statut promo

Reconstruction du schéma :

```bash
npx tsx scripts/init-db.ts
```

## Scraping

Scrape hebdomadaire complet :

```bash
npm run scrape
```

Scrape des bons plans :

```bash
npm run scrape:deals
```

Rapports produits :

- `scrape-results.json`
- `scrape-history.log`

## Déploiement

Le projet est prévu pour Vercel avec une source de vérité en base de données et un job planifié séparé pour le scraping.
Le hook de postbuild reste désactivé par défaut afin d'éviter un scrape lourd pendant les déploiements.

Avant publication publique, configurez la base, exécutez un scrape complet puis vérifiez la couverture des enseignes.
