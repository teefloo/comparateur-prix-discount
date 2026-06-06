<p align="center">
  <img src="public/logo.png" alt="ComparPrix" width="160" />
</p>

<h1 align="center">ComparPrix</h1>

<p align="center">
  <em>Das Discount-Preismagazin — № 01, Wöchentlich.</em>
</p>

<p align="center">
  <a href="#funktionsweise"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-App%20Router-0F1623?style=flat-square&logo=nextdotjs&logoColor=FCFDFE" /></a>
  <a href="#technischer-stack"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=FCFDFE" /></a>
  <a href="#datenbank"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Vercel-336791?style=flat-square&logo=postgresql&logoColor=FCFDFE" /></a>
  <a href="#scraping"><img alt="Playwright" src="https://img.shields.io/badge/Playwright-Chromium-2EAD33?style=flat-square&logo=playwright&logoColor=FCFDFE" /></a>
  <a href="#schnellstart"><img alt="Node 22" src="https://img.shields.io/badge/Node-%E2%89%A522.17-339933?style=flat-square&logo=nodedotjs&logoColor=FCFDFE" /></a>
  <a href="LICENSE"><img alt="Lizenz" src="https://img.shields.io/badge/License-SEE%20LICENSE%20IN%20FILE-0F2C52?style=flat-square" /></a>
</p>

<p align="center">
  <a href="#schnellstart">Schnellstart</a> ·
  <a href="#technischer-stack">Stack</a> ·
  <a href="#h%C3%A4ndler">Händler</a> ·
  <a href="#kategorien">Kategorien</a> ·
  <a href="#scraping">Scraping</a> ·
  <a href="#automatisierung">GitHub Actions</a> ·
  <a href="#bereitstellung">Bereitstellung</a>
</p>

<!-- README-I18N:START -->

[Français](./README.md) | [English](./README.en.md) | [Español](./README.es.md) | **[Deutsch](./README.de.md)** | [Italiano](./README.it.md)

<!-- README-I18N:END -->

---

> [!NOTE]
> **Das Schnäppchen-Jagd-Magazin.** Eine einzige Liste, **zehn Discount-Händler**, und immer der fairste Preis griffbereit. ComparPrix liest, vergleicht, sortiert — und veröffentlicht wöchentlich eine Bestandsaufnahme, ohne Schnickschnack.

---

## Inhalt

- [Manifest](#manifest)
- [Funktionsweise](#funktionsweise)
- [Technischer Stack](#technischer-stack)
- [Händler](#h%C3%A4ndler)
- [Kategorien](#kategorien)
- [Datenarchitektur](#datenarchitektur)
- [Schnellstart](#schnellstart)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Datenbank](#datenbank)
- [Scraping](#scraping)
- [Automatisierung](#automatisierung)
- [API](#api)
- [Prüfungen](#pr%C3%BCfungen)
- [Bereitstellung](#bereitstellung)
- [Rechtliche Seiten & Links](#rechtliche-seiten--links)

---

## Manifest

Discount ist keine Kategorie, sondern eine Lebenseinstellung: das richtige Produkt, zum richtigen Preis, beim richtigen Händler finden, ohne eine Stunde zu verlieren. Genau das tut ComparPrix.

- **Eine Basis, zehn Händler.** Alle Angebote liegen in einer einzigen Quelle der Wahrheit; die UI scrapt nie spontan.
- **Ehrlichkeit an der Oberfläche.** Kategorien, durchgestrichene Preise, Rabatte — jede Karte spiegelt, was in der Datenbank steht, nicht mehr.
- **Redaktioneller Ton.** *Das Discount-Preismagazin* ist ein Logbuch. Das Design lässt sich davon inspirieren, der Code respektiert es.
- **Null Geheimnisse.** Scraper, Schemata, Überwachungsskripte: alles versioniert, alles lokal ausführbar.

> [!TIP]
> ComparPrix steht **nicht** in Verbindung mit den Händlern, die es indexiert. Alle genannten Marken gehören ihren jeweiligen Eigentümern.

---

## Funktionsweise

```text
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Scrapers (Playwright / fetch) │ ─► │ PostgreSQL (products + prices) │ ─► │ UI Next.js (revalidate 300s)  │
└────────────────────┘    └────────────────────┘    └────────────────────┘
        ▲                                                       ▲
        │                                                       │
┌────────────────────┐                                  ┌────────────────────┐
│ GitHub Actions (cron + manual)             │                                  │ /api/search with fallback       │
└────────────────────┘                                  └────────────────────┘
```

Drei klar getrennte Lesepfade:

1. **Startseite `/`** — DB-Lesen hat Vorrang, mit Live-`search`-Fallback, wenn die Datenbank zu wenige Ergebnisse liefert (≤ 5).
2. **Bereich `/deals`** — Zeigt **ausschließlich** die in der Datenbank gespeicherten Aktionsangebote. Nie Live-Scraping.
3. **`/api/search`** — JSON-Endpunkt mit Fallback-Kette: `database → real-time → demo-fallback`. Siehe [`src/app/api/search/AGENTS.md`](src/app/api/search/AGENTS.md).

> [!IMPORTANT]
> Browser-Scraper (Action, B&M, Centrakor, Aldi) sind **auf Vercel automatisch deaktiviert**. Das Rendering der Deals-Seite bleibt strikt datenbankgestützt, sodass ein Deployment niemals einen Headless-Browser startet.

---

## Technischer Stack

| Schicht | Wahl | Warum |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org) App Router + Turbopack | RSC, ISR (`revalidate = 300s`), native `route handlers` |
| UI | React 19, Tailwind CSS 3, Framer Motion 12 | Nüchterne Komponenten, redaktionelle Mikroanimationen |
| Icons | [Lucide](https://lucide.dev) | Konsistentes Set, tree-shakable |
| Client-Suche | [Fuse.js](https://fusejs.io) | Tippfehlertoleranz, gewichtbar |
| Datenbank | Vercel Postgres (Lesen `@vercel/postgres`, Batch-Schreiben `pg`) | Transaktional, einfach bereitzustellen |
| Scraping | [Playwright](https://playwright.dev) Chromium (Browser) + natives `fetch` (HTML/JSON) | Mix je nach Händler-Abwehr |
| HTML-Parsing | [Cheerio](https://cheerio.js.org) | Schnell, vertraute jQuery-Syntax |
| Validierung | `scraper-utils.ts` (Stichwort + Domain + Preis + Quellidentität) | Explizite Zurückweisungen, nie stillschweigende Koerzion |
| Typografie | Bricolage Grotesque, Big Shoulders, Fraunces, JetBrains Mono | Redaktionelle Stimme des *Bulletins* |
| Palette | Ink `#0F1623` · Navy `#0F2C52` · Navy-deep `#081C36` · Cream `#FCFDFE` | AAA-Kontrast bei den meisten Paarungen |

---

## Händler

Zehn Discounter, zehn Scraping-Ansätze. Die Tabelle spiegelt die Quelle der Wahrheit in `src/lib/catalog.ts`:

| Slug | Händler | Domain | Technologie | Strategie |
| --- | --- | --- | --- | --- |
| `action` | Action | `action.com` | Playwright | Browser (Cloudflare) |
| `stokomani` | Stokomani | `stokomani.fr` | `fetch` + Shopify JSON | Storefront API |
| `bm` | B&M | `bmstores.fr` | Playwright | Browser |
| `centrakor` | Centrakor | `centrakor.com` | Playwright + Apollo state | Injizierter GraphQL-Zustand |
| `aldi` | Aldi | `aldi.fr` | Playwright | Browser |
| `gifi` | GiFi | `gifi.fr` | `fetch` + HTML / JSON-LD | Multi-Format-Fallback |
| `lafoirfouille` | La Foir'Fouille | `lafoirfouille.fr` | `fetch` | HTML |
| `lidl` | Lidl | `lidl.fr` | `fetch` | HTML + Bild-CDN |
| `maxibazar` | Maxi Bazar | `maxibazar.fr` | `fetch` | HTML |
| `noz` | Noz | `noz.fr` | `fetch` | HTML |

> [!TIP]
> Die Details jedes Scrapers stehen in [`src/lib/scrapers/AGENTS.md`](src/lib/scrapers/AGENTS.md). Die `*Detailed` exportieren `{ offers, issues, coverage }` — die Persistenz ist in `weekly-scrape.ts` zentralisiert, niemals innerhalb der Scraper.

### Wöchentliche Strategie

Die Händler verteilen sich auf zwei Gruppen:

- **Erforderlich** — `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`. 3 Versuche, Fehlschlag ⇒ Job bricht ab.
- **Optional** — `lafoirfouille`, `lidl`, `maxibazar`, `noz`. 1 toleranter Versuch: teilweise Abdeckung wird akzeptiert.

---

## Kategorien

Dreizehn Abteilungen, streng in der Datenbank abgebildet (SQL `CHECK`), um Kategorisierungs-Leaks zu vermeiden.

| Slug | Bezeichnung | Slug | Bezeichnung |
| --- | --- | --- | --- |
| `hygiene` | Hygiene | `animaux` | Tiere |
| `alimentation` | Lebensmittel | `textile` | Textilien |
| `menage` | Haushalt | `mode` | Mode |
| `maison-deco` | Haus & Deko | `high-tech` | High-Tech |
| `jardin` | Garten | `bazar` | Allgemein |
| `bricolage` | Heimwerken | `jouets` | Spielzeug |
| `loisirs` | Freizeit | | |

> [!NOTE]
> Die Kategorieauflösung bevorzugt **native Metadaten** (Quellpfad) gegenüber der Schlüsselwort-Inferenz. Der finale Fallback ist `bazar`, niemals ein `|| 'menage'` als Standard.

---

## Datenarchitektur

Zwei Tabellen, zwei Verantwortlichkeiten:

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

- **Lesen** über `@vercel/postgres` (`sql.query`).
- **Schreiben** über `pg.Client` in expliziten Transaktionen, chunkweise zu **150 Produkten** / **200 Preisen**.
- **Aufräumen**: `pruneStaleOffersByRetailer` löscht Angebote eines Händlers, die im letzten aktiven Batch fehlen.

Details zu Schema, Validierungsregeln und SQL-Constraints stehen in [`scripts/init-db.ts`](scripts/init-db.ts).

---

## Schnellstart

> [!IMPORTANT]
> **Node ≥ 22.17** ist erforderlich (siehe CI-Workflows). `nvm use 22.17.0` ist dein bester Verbündeter.

```bash
# 1. Klonen und installieren
git clone https://github.com/<owner>/comparateur-prix-discount.git
cd comparateur-prix-discount
npm install

# 2. Chromium für die Browser-Scraper bereitstellen
npx playwright install chromium

# 3. Umgebung konfigurieren
cp .env.example .env.local
# .env.local bearbeiten → POSTGRES_URL=...

# 4. (Optional, aber empfohlen) Schema neu aufbauen
npx tsx scripts/init-db.ts

# 5. Im Dev-Modus starten
npm run dev
```

Die App wird standardmäßig auf `http://localhost:3000` ausgeliefert.

> [!TIP]
> Ohne `POSTGRES_URL` läuft die Startseite im degradierten Modus: Der Endpunkt `/api/search` schaltet automatisch auf das Demo-Set (22 Karten) um.

---

## Umgebungsvariablen

| Variable | Erforderlich | Beschreibung |
| --- | --- | --- |
| `POSTGRES_URL` | empfohlen | Vercel-Postgres-URL (bevorzugt). |
| `DATABASE_URL` | Alias | Als Äquivalent akzeptiert; beim Start auf `POSTGRES_URL` normalisiert. |
| `VERCEL_ENABLE_POSTBUILD_SCRAPE` | optional | Aktiviert den Postbuild-Hook (siehe [Bereitstellung](#bereitstellung)). Im Normalbetrieb leer/Standard lassen. |

Das Modul `src/lib/ensure-db-env.ts` harmonisiert beide Namen und vermeidet so Überraschungen zwischen Local und CI.

---

## Datenbank

### Initialisierung (destruktiv)

```bash
npx tsx scripts/init-db.ts
```

Das Skript **zerstört** und erstellt die Tabellen `products` und `prices` neu, mit `CHECK`-Constraints auf die unterstützten Händler und Kategorien. Bei der Erstbereitstellung oder für einen vollständigen Reset verwenden.

> [!WARNING]
> Diese Operation ist **destruktiv**. Sie darf niemals ohne vorherigen Snapshot gegen eine Datenbank mit Produktionsdaten ausgeführt werden.

### Künftige Migrationen

Das Projekt verwendet noch kein inkrementelles Migrationstool (Drizzle, Prisma usw.). Schemaänderungen werden bis zu einer entsprechenden Entscheidung als neues Skript unter `scripts/` ausgeliefert.

---

## Scraping

### Vollständiger wöchentlicher Scrape

```bash
npm run scrape
```

Orchestrierung:

- **Lesen** aller zehn Händler mit echtem Scraping.
- **Validieren** über `scraper-utils.ts` (lehnt `missing_name`, `wrong_domain`, `invalid_price`, `duplicate_offer` usw. ab).
- **Persistieren** in der Datenbank über transaktionale Batches.
- **Berichte**: `scrape-results.json` (maschinelle Zusammenfassung) und `scrape-history.log` (menschliche Zeitleiste).

### Gezielter Deals-Scrape

```bash
npm run scrape:deals
# oder für einen bestimmten Händler:
npm run scrape:deals action,aldi
```

Filtert Aktionsangebote (über `isPromotionalOffer`) und speichert nur die Deals.

### Scrape pro Händler

```bash
npm run scrape:gifi
npm run scrape:lafoirfouille
npm run scrape:lidl
npm run scrape:maxibazar
npm run scrape:noz
npm run fix:gifi-images
```

### Überwachung (Abdeckungs-Audit)

```bash
npm run supervise               # alle Händler
npm run supervise:gifi          # ein bestimmter Händler
```

Erzeugt `supervision-results.json`, `supervision-report.txt` und füttert `supervision-history.log`. Ideal nach einer Selektor-Änderung oder einer Upstream-Blockade.

> [!TIP]
> Führe `npm run supervise` nach jeder Scraper-Änderung aus, um Regressionen zu messen, bevor du einen PR öffnest.

---

## Automatisierung

Zwei GitHub-Actions-Workflows:

| Workflow | Auslöser | Effekt |
| --- | --- | --- |
| `.github/workflows/daily-full-scrape.yml` | Cron (mit Europe/Paris-TZ-Wache) | Vollständiger wöchentlicher Scrape + DB-Persistenz |
| `.github/workflows/deals-scrape.yml` | `workflow_dispatch` (manuell) | On-Demand-Refresh der Deals |

Beide Workflows nutzen denselben Node-22.17-Runner und verwenden `npx tsx`, um TypeScript-Skripte direkt auszuführen, ohne zusätzlichen Build-Schritt.

---

## API

| Endpunkt | Methode | Beschreibung |
| --- | --- | --- |
| `/api/search` | `GET` | Multi-Quellen-Suche (DB → live → demo). Query-Params: `query`, `category`, `retailer`, `minPrice`, `maxPrice`, `sort`. |
| `/api/deals` | `GET` | Deals ausschließlich aus der Datenbank. |
| `/api/produit` | `GET` | Normalisiertes Angebotsdetail zum Teilen. |

Alle Endpunkte sind mit `dynamic = 'force-dynamic'` markiert und liefern eine stabile JSON-Nutzlast. Die Antwortform ist in `AGENTS.md` im Stammverzeichnis jedes Ordners dokumentiert.

---

## Prüfungen

```bash
npm run lint             # ESLint (next/core-web-vitals)
npm run typecheck        # tsc --noEmit für App + Skripte
npm run test:categories  # Node-built-in-Suite via tsx
```

> [!IMPORTANT]
> Der `typecheck` prüft **beide** tsconfigs: `tsconfig.json` (Anwendungscode) und `tsconfig.scripts.json` (Ops-Skripte). Beide müssen vor jedem PR grün bleiben.

---

## Bereitstellung

Ziel: **Vercel**, Vercel-Postgres-Datenbank, Scraping auf GitHub Actions.

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

### `postbuild`-Hook

`package.json` stellt einen `postbuild` bereit (`scripts/vercel-postbuild-scrape.mjs`):

- **Standardmäßig inaktiv** — `VERCEL_ENABLE_POSTBUILD_SCRAPE` muss `'1'` sein, um das Scraping während eines Deployments auszulösen.
- **Empfohlen:** Hook im Normalbetrieb **deaktiviert** lassen. Das Scraping läuft parallel über den GitHub-Actions-Cron, um Build und Ingestion zu entkoppeln.

### Vorgehen für die Ersteinrichtung

1. Vercel Postgres bereitstellen.
2. `POSTGRES_URL` in den Vercel-Umgebungsvariablen hinterlegen.
3. `npx tsx scripts/init-db.ts` gegen die Prod-Datenbank (von einem autorisierten Runner).
4. Einen ersten `npm run scrape` ausführen, um die Daten zu seeden.
5. Abdeckung pro Händler prüfen: `npm run supervise`.
6. Den GitHub-Actions-Zeitplan (`daily-full-scrape.yml`) aktivieren.

---

## Rechtliche Seiten & Links

Die Footer der App verweist auf die folgenden Seiten, die vom App Router ausgeliefert werden:

- `/` — Produktsuche
- `/deals` — Aktuelle Angebote
- `/a-propos` — Manifest
- `/faq` — Häufig gestellte Fragen
- `/cgu` — Allgemeine Nutzungsbedingungen
- `/cookies` — Cookie-Richtlinie
- `/mentions-legales` — Impressum
- `/politique-confidentialite` — Datenschutzerklärung

> [!NOTE]
> Die Dateien `LICENSE`, `CONTRIBUTING` und `CHANGELOG` (falls vorhanden) sind absichtlich aus diesem README ausgeschlossen: Sie liegen im Stammverzeichnis des Repos, um für GitHub auffindbar zu bleiben.

---

<p align="center">
  <sub>№ 01 — Wöchentlich · 10 Händler · 13 Kategorien · <a href="public/brand/concept-2-etiquette/horizontal.svg">L'Étiquette</a> als visuelle Signatur gewählt.</sub>
</p>
