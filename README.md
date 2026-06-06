<p align="center">
  <img src="public/logo.png" alt="ComparPrix" width="160" />
</p>

<h1 align="center">ComparPrix</h1>

<p align="center">
  <em>Le Bulletin des Prix Discount — № 01, Hebdomadaire.</em>
</p>

<p align="center">
  <a href="#-fonctionnement"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-App%20Router-0F1623?style=flat-square&logo=nextdotjs&logoColor=FCFDFE" /></a>
  <a href="#-stack-technique"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=FCFDFE" /></a>
  <a href="#-base-de-donn%C3%A9es"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Vercel-336791?style=flat-square&logo=postgresql&logoColor=FCFDFE" /></a>
  <a href="#-scraping"><img alt="Playwright" src="https://img.shields.io/badge/Playwright-Chromium-2EAD33?style=flat-square&logo=playwright&logoColor=FCFDFE" /></a>
  <a href="#-d%C3%A9marrage-rapide"><img alt="Node 22" src="https://img.shields.io/badge/Node-%E2%89%A522.17-339933?style=flat-square&logo=nodedotjs&logoColor=FCFDFE" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-SEE%20LICENSE%20IN%20FILE-0F2C52?style=flat-square" /></a>
</p>

<p align="center">
  <a href="#-d%C3%A9marrage-rapide">Démarrage rapide</a> ·
  <a href="#-stack-technique">Stack</a> ·
  <a href="#-enseignes">Enseignes</a> ·
  <a href="#-cat%C3%A9gories">Catégories</a> ·
  <a href="#-scraping">Scraping</a> ·
  <a href="#-automatisation">GitHub Actions</a> ·
  <a href="#-d%C3%A9ploiement">Déploiement</a>
</p>

<!-- README-I18N:START -->

**[Français](./README.md)** | [English](./README.en.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md)

<!-- README-I18N:END -->

---

> [!NOTE]
> **Le bulletin de chasse aux bonnes affaires.** Une seule liste, **dix enseignes discount**, et toujours le prix le plus juste à portée de main. ComparPrix lit, compare, classe — puis publie un état des lieux hebdomadaire, sans bling-bling.

---

## Sommaire

- [Manifeste](#-manifeste)
- [Fonctionnement](#-fonctionnement)
- [Stack technique](#-stack-technique)
- [Enseignes](#-enseignes)
- [Catégories](#-cat%C3%A9gories)
- [Architecture des données](#-architecture-des-donn%C3%A9es)
- [Démarrage rapide](#-d%C3%A9marrage-rapide)
- [Variables d'environnement](#-variables-denvironnement)
- [Base de données](#-base-de-donn%C3%A9es)
- [Scraping](#-scraping)
- [Automatisation](#-automatisation)
- [API](#-api)
- [Vérifications](#-v%C3%A9rifications)
- [Déploiement](#-d%C3%A9ploiement)
- [Pages légales & liens](#-pages-l%C3%A9gales--liens)

---

## Manifeste

Le discount n'est pas une catégorie, c'est un état d'esprit : on cherche le bon produit, au bon prix, chez la bonne enseigne, sans perdre une heure. ComparPrix fait exactement cela.

- **Une base, dix enseignes.** Toutes les offres persistent dans une source de vérité unique ; l'UI ne scrape jamais à la volée.
- **Honnêteté de surface.** Catégories, prix barrés, remises — chaque carte reflète ce qui est en base, rien de plus.
- **Ton éditorial.** `Le Bulletin des Prix Discount`, c'est un journal de bord. Le visuel s'en inspire, le code le respecte.
- **Zéro secret.** Scrapers, schémas, scripts de supervision : tout est versionné, tout est exécutable localement.

> [!TIP]
> ComparPrix n'est **pas** affilié aux enseignes qu'il indexe. Toutes les marques citées appartiennent à leurs propriétaires respectifs.

---

## Fonctionnement

```text
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Scrapers (Playwright / fetch) │ ─► │ PostgreSQL (products + prices) │ ─► │ UI Next.js (revalidate 300s)  │
└────────────────────┘    └────────────────────┘    └────────────────────┘
        ▲                                                       ▲
        │                                                       │
┌────────────────────┐                                  ┌────────────────────┐
│ GitHub Actions (cron + manuel)             │                                  │ /api/search avec fallback       │
└────────────────────┘                                  └────────────────────┘
```

Trois chemins de lecture bien séparés :

1. **Page d'accueil `/`** — Lecture DB en priorité, fallback `recherche` live si la base renvoie peu de résultats (≤ 5).
2. **Section `/deals`** — Affiche **uniquement** les offres promotionnelles persistées en base. Jamais de scrape live.
3. **`/api/search`** — Endpoint JSON avec chaîne de secours : `database → real-time → demo-fallback`. Voir [`src/app/api/search/AGENTS.md`](src/app/api/search/AGENTS.md).

> [!IMPORTANT]
> Les scrapers navigateur (Action, B&M, Centrakor, Aldi) sont **automatiquement désactivés sur Vercel**. Le rendu de la page Bons plans reste strictement basé sur la base, ce qui garantit qu'un déploiement ne lance jamais de navigateur headless.

---

## Stack technique

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org) App Router + Turbopack | RSC, ISR (`revalidate = 300s`), `route handlers` natifs |
| UI | React 19, Tailwind CSS 3, Framer Motion 12 | Composants sobres, micro-animations éditoriales |
| Icônes | [Lucide](https://lucide.dev) | Set cohérent, tree-shakable |
| Recherche client | [Fuse.js](https://fusejs.io) | Tolérance orthographique, pondérable |
| Base de données | Vercel Postgres (lecture `@vercel/postgres`, écriture batch `pg`) | Transactionnel, simple à provisionner |
| Scraping | [Playwright](https://playwright.dev) Chromium (navigateur) + `fetch` natif (HTML/JSON) | Mix selon les défenses de chaque enseigne |
| Parsing HTML | [Cheerio](https://cheerio.js.org) | Rapide, syntaxe jQuery familière |
| Validation | `scraper-utils.ts` (mot-clé + domaine + prix + identité source) | Rejets explicites, jamais de coercion silencieuse |
| Typographie | Bricolage Grotesque, Big Shoulders, Fraunces, JetBrains Mono | Voix éditoriale `Le Bulletin` |
| Palette | Ink `#0F1623` · Navy `#0F2C52` · Navy-deep `#081C36` · Cream `#FCFDFE` | Contraste AAA sur la majorité des paires |

---

## Enseignes

Dix discounters, dix approches de scraping. Le tableau reflète la source de vérité de `src/lib/catalog.ts` :

| Slug | Enseigne | Domaine | Technologie | Stratégie |
| --- | --- | --- | --- | --- |
| `action` | Action | `action.com` | Playwright | Navigateur (Cloudflare) |
| `stokomani` | Stokomani | `stokomani.fr` | `fetch` + Shopify JSON | Storefront API |
| `bm` | B&M | `bmstores.fr` | Playwright | Navigateur |
| `centrakor` | Centrakor | `centrakor.com` | Playwright + Apollo state | État GraphQL injecté |
| `aldi` | Aldi | `aldi.fr` | Playwright | Navigateur |
| `gifi` | GiFi | `gifi.fr` | `fetch` + HTML / JSON-LD | Fallback multi-format |
| `lafoirfouille` | La Foir'Fouille | `lafoirfouille.fr` | `fetch` | HTML |
| `lidl` | Lidl | `lidl.fr` | `fetch` | HTML + CDN images |
| `maxibazar` | Maxi Bazar | `maxibazar.fr` | `fetch` | HTML |
| `noz` | Noz | `noz.fr` | `fetch` | HTML |

> [!TIP]
> Le détail de chaque scraper est dans [`src/lib/scrapers/AGENTS.md`](src/lib/scrapers/AGENTS.md). Les `*Detailed` exportent `{ offers, issues, coverage }` — la persistance est centralisée dans `weekly-scrape.ts`, jamais dans les scrapers.

### Stratégie hebdomadaire

Les enseignes se répartissent en deux groupes :

- **Requis** — `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`. 3 tentatives, échec ⇒ job en erreur.
- **Optionnels** — `lafoirfouille`, `lidl`, `maxibazar`, `noz`. 1 tentative tolérante : la couverture partielle est acceptée.

---

## Catégories

Treize rayons, mappés strictement en base (`CHECK` SQL) pour éviter les fuites de catégorisation.

| Slug | Libellé | Slug | Libellé |
| --- | --- | --- | --- |
| `hygiene` | Hygiène | `animaux` | Animaux |
| `alimentation` | Alimentation | `textile` | Textile |
| `menage` | Ménage | `mode` | Mode |
| `maison-deco` | Maison & Déco | `high-tech` | High-Tech |
| `jardin` | Jardin | `bazar` | Bazar |
| `bricolage` | Bricolage | `jouets` | Jouets |
| `loisirs` | Loisirs | | |

> [!NOTE]
> La résolution de catégorie privilégie les **métadonnées natives** (chemin source) plutôt que l'inférence par mots-clés. Le fallback final est `bazar`, jamais un `|| 'menage'` par défaut.

---

## Architecture des données

Deux tables, deux responsabilités :

```sql
products (
  id, store_id, source_product_id, source_url,
  source_category_path, name, category, brand, image,
  description, availability, quantity, unit_price,
  last_scraped_at, created_at,
  UNIQUE (store_id, source_product_id)
)

prices (
  product_id PK REFERENCES products(id) ON DELETE CASCADE,
  price, original_price, discount, is_on_promotion, updated_at
)
```

- **Lecture** via `@vercel/postgres` (`sql.query`).
- **Écriture** via `pg.Client` en transactions explicites, chunkées à **150 produits** / **200 prix**.
- **Purge** : `pruneStaleOffersByRetailer` supprime les offres d'une enseigne absentes du dernier lot actif.

Le détail du schéma, des règles de validation et des contraintes SQL est dans [`scripts/init-db.ts`](scripts/init-db.ts).

---

## Démarrage rapide

> [!IMPORTANT]
> **Node ≥ 22.17** est requis (cf. workflows CI). `nvm use 22.17.0` est ton meilleur allié.

```bash
# 1. Cloner et installer
git clone https://github.com/<owner>/comparateur-prix-discount.git
cd comparateur-prix-discount
npm install

# 2. Préparer Chromium pour les scrapers navigateur
npx playwright install chromium

# 3. Configurer l'environnement
cp .env.example .env.local
# éditer .env.local → POSTGRES_URL=...

# 4. (Optionnel mais recommandé) reconstruire le schéma
npx tsx scripts/init-db.ts

# 5. Lancer en dev
npm run dev
```

L'application est servie sur `http://localhost:3000` par défaut.

> [!TIP]
> Sans `POSTGRES_URL`, la page d'accueil fonctionne en mode dégradé : le endpoint `/api/search` basculera automatiquement sur le jeu de démonstration (22 cartes).

---

## Variables d'environnement

| Variable | Requise | Description |
| --- | --- | --- |
| `POSTGRES_URL` | recommandée | URL Postgres Vercel (préférée). |
| `DATABASE_URL` | alias | Acceptée comme équivalent ; normalisée vers `POSTGRES_URL` au démarrage. |
| `VERCEL_ENABLE_POSTBUILD_SCRAPE` | optionnelle | Active le hook de postbuild (voir [Déploiement](#-d%C3%A9ploiement)). Laisser vide/défaut en production normale. |

Le module `src/lib/ensure-db-env.ts` harmonise les deux noms, ce qui évite les surprises entre local et CI.

---

## Base de données

### Initialisation (destructive)

```bash
npx tsx scripts/init-db.ts
```

Le script **détruit** puis recrée les tables `products` et `prices`, avec les contraintes `CHECK` sur les enseignes et catégories supportées. À utiliser en premier déploiement ou pour reset complet.

> [!WARNING]
> Cette opération est **destructive**. Elle ne doit jamais être exécutée contre une base contenant des données de production sans snapshot préalable.

### Migrations futures

Le projet n'utilise pas encore d'outil de migration incrémentale (Drizzle, Prisma, etc.). Toute évolution de schéma se fait via un nouveau script sous `scripts/` jusqu'à décision contraire.

---

## Scraping

### Scrape hebdomadaire complet

```bash
npm run scrape
```

Orchestration :

- **Lecture** des dix enseignes avec scraping réel.
- **Validation** par `scraper-utils.ts` (rejet `missing_name`, `wrong_domain`, `invalid_price`, `duplicate_offer`, etc.).
- **Persistance** en base via batches transactionnels.
- **Rapports** : `scrape-results.json` (résumé machine) et `scrape-history.log` (timeline humaine).

### Scrape ciblé Bons plans

```bash
npm run scrape:deals
# ou pour une enseigne précise :
npm run scrape:deals action,aldi
```

Filtre les offres promotionnelles (via `isPromotionalOffer`) et persiste uniquement les deals.

### Scrape par enseigne

```bash
npm run scrape:gifi
npm run scrape:lafoirfouille
npm run scrape:lidl
npm run scrape:maxibazar
npm run scrape:noz
npm run fix:gifi-images
```

### Supervision (audit de couverture)

```bash
npm run supervise               # toutes les enseignes
npm run supervise:gifi          # une enseigne précise
```

Génère `supervision-results.json`, `supervision-report.txt` et alimente `supervision-history.log`. Idéal après un changement de sélecteur ou un blocage upstream.

> [!TIP]
> Lance `npm run supervise` après chaque modification de scraper pour mesurer la régression avant d'ouvrir une PR.

---

## Automatisation

Deux workflows GitHub Actions :

| Workflow | Déclencheur | Effet |
| --- | --- | --- |
| `.github/workflows/daily-full-scrape.yml` | Cron (avec garde TZ Europe/Paris) | Scrape hebdomadaire complet + persistance DB |
| `.github/workflows/deals-scrape.yml` | `workflow_dispatch` (manuel) | Refresh des bons plans à la demande |

Les deux workflows s'appuient sur le même runner Node 22.17 et utilisent `npx tsx` pour exécuter les scripts TypeScript directement, sans étape de build supplémentaire.

---

## API

| Endpoint | Méthode | Description |
| --- | --- | --- |
| `/api/search` | `GET` | Recherche multi-source (DB → live → démo). Query params : `query`, `category`, `retailer`, `minPrice`, `maxPrice`, `sort`. |
| `/api/deals` | `GET` | Bons plans issus de la base uniquement. |
| `/api/produit` | `GET` | Détail d'une offre normalisée pour partage. |

Tous les endpoints sont marqués `dynamic = 'force-dynamic'` et retournent un payload JSON stable. La forme des réponses est documentée dans `AGENTS.md` à la racine de chaque dossier.

---

## Vérifications

```bash
npm run lint             # ESLint (next/core-web-vitals)
npm run typecheck        # tsc --noEmit sur app + scripts
npm run test:categories  # suite Node built-in via tsx
```

> [!IMPORTANT]
> Le `typecheck` vérifie **les deux** tsconfigs : `tsconfig.json` (code applicatif) et `tsconfig.scripts.json` (scripts d'exploitation). Les deux doivent rester verts avant chaque PR.

---

## Déploiement

Cible : **Vercel**, base Vercel Postgres, scraping sur GitHub Actions.

```text
         ┌──────────────────────┐
         │      GitHub repo      │
         └──────────┬───────────┘
                    │ push
                    ▼
         ┌──────────────────────┐
         │  Vercel (build)      │
         │  next build          │
         │  postbuild (disabled)│
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Vercel Postgres     │ ◄── daily-full-scrape.yml (cron)
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Production site     │ ◄── ISR (revalidate 300s)
         └──────────────────────┘
```

### Hook `postbuild`

`package.json` expose un `postbuild` (`scripts/vercel-postbuild-scrape.mjs`) :

- **Inactif par défaut** — `VERCEL_ENABLE_POSTBUILD_SCRAPE` doit valoir `'1'` pour déclencher le scrape pendant un déploiement.
- **Recommandé :** garder le hook **désactivé** en production normale. Le scraping tourne en parallèle via le cron GitHub Actions pour découpler build et ingestion.

### Procédure de premier déploiement

1. Provisionner Vercel Postgres.
2. Alimenter `POSTGRES_URL` dans les variables d'environnement Vercel.
3. `npx tsx scripts/init-db.ts` contre la base de prod (depuis un runner autorisé).
4. Lancer un `npm run scrape` initial pour amorcer les données.
5. Vérifier la couverture par enseigne : `npm run supervise`.
6. Activer la planification GitHub Actions (`daily-full-scrape.yml`).

---

## Pages légales & liens

Le footer de l'application référence les pages suivantes, servies par l'App Router :

- `/` — Recherche produits
- `/deals` — Bons plans du moment
- `/a-propos` — Manifeste
- `/faq` — Foire aux questions
- `/cgu` — Conditions générales d'utilisation
- `/cookies` — Politique cookies
- `/mentions-legales` — Mentions légales
- `/politique-confidentialite` — Politique de confidentialité

> [!NOTE]
> Les fichiers `LICENSE`, `CONTRIBUTING` et `CHANGELOG` (s'ils existent) sont volontairement exclus de ce README : ils vivent à la racine du dépôt pour rester découvrables par GitHub.

---

<p align="center">
  <sub>№ 01 — Hebdomadaire · 10 enseignes · 13 catégories · <a href="public/brand/concept-2-etiquette/horizontal.svg">L'Étiquette</a> retenue comme signature visuelle.</sub>
</p>
