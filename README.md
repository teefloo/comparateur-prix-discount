# Comparateur de Prix Discount

Comparateur de prix discount pour **Action**, **Stokomani**, **B&M**, **Centrakor** et **Aldi**.

## Fonctionnalités

- Recherche d'offres en base ou en fallback live scraping
- Stockage **store-specific**: une offre par enseigne et par URL/source produit
- Couverture de 9 catégories: `hygiene`, `alimentation`, `menage`, `maison-deco`, `jardin`, `bricolage`, `loisirs`, `animaux`, `textile`
- Scraping hebdomadaire avec rapport de validation par enseigne
- Suivi des rejets de scraping (`wrong_domain`, `invalid_price`, `unsupported_category`, etc.)

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
```

## Base de données

Le schéma stocke désormais les offres par enseigne:

- `products`: métadonnées d'offre (`store_id`, `source_product_id`, `source_url`, `category`, `quantity`, `unit_price`, etc.)
- `prices`: snapshot courant du prix (`price`, `original_price`, `discount`, `is_on_promotion`)

Reconstruction du schéma:

```bash
npx tsx scripts/init-db.ts
```

Nettoyage des données:

```bash
npx tsx scripts/clean-db.ts
```

## Scraping

Scrape complet:

```bash
npm run scrape
```

Mise à jour ciblée des recherches populaires:

```bash
npx tsx scripts/update-popular.ts
```

Le fichier `scrape-results.json` contient:

- le timestamp du dernier run
- les volumes `raw`, `validated`, `rejected`
- les raisons de rejet par enseigne
- la répartition par catégorie

## Déploiement

1. Déployer sur Vercel
2. Configurer `POSTGRES_URL` ou `DATABASE_URL`
3. Recréer le schéma si nécessaire avec `scripts/init-db.ts`
4. Lancer un scrape complet avec `npm run scrape`

Sur Vercel, chaque déploiement exécute automatiquement le scrape hebdomadaire après le build.
Pour le désactiver temporairement sur un déploiement précis, définir `VERCEL_SKIP_SCRAPE=1`.
