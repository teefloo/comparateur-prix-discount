<p align="center">
  <img src="public/logo.png" alt="ComparPrix" width="160" />
</p>

<h1 align="center">ComparPrix</h1>

<p align="center">
  <em>Il Magazine dei Prezzi Discount — № 01, Ogni Settimana.</em>
</p>

<p align="center">
  <a href="#funzionamento"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-App%20Router-0F1623?style=flat-square&logo=nextdotjs&logoColor=FCFDFE" /></a>
  <a href="#stack-tecnico"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=FCFDFE" /></a>
  <a href="#database"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Vercel-336791?style=flat-square&logo=postgresql&logoColor=FCFDFE" /></a>
  <a href="#scraping"><img alt="Playwright" src="https://img.shields.io/badge/Playwright-Chromium-2EAD33?style=flat-square&logo=playwright&logoColor=FCFDFE" /></a>
  <a href="#avvio-rapido"><img alt="Node 22" src="https://img.shields.io/badge/Node-%E2%89%A522.17-339933?style=flat-square&logo=nodedotjs&logoColor=FCFDFE" /></a>
  <a href="LICENSE"><img alt="Licenza" src="https://img.shields.io/badge/License-SEE%20LICENSE%20IN%20FILE-0F2C52?style=flat-square" /></a>
</p>

<p align="center">
  <a href="#avvio-rapido">Avvio rapido</a> ·
  <a href="#stack-tecnico">Stack</a> ·
  <a href="#insegne">Insegne</a> ·
  <a href="#categorie">Categorie</a> ·
  <a href="#scraping">Scraping</a> ·
  <a href="#automazione">GitHub Actions</a> ·
  <a href="#distribuzione">Distribuzione</a>
</p>

<!-- README-I18N:START -->

[Français](./README.md) | [English](./README.en.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | **[Italiano](./README.it.md)**

<!-- README-I18N:END -->

---

> [!NOTE]
> **Il Magazine delle occasioni.** Un unico elenco, **dieci insegne discount**, e sempre il prezzo più equo a portata di mano. ComparPrix legge, confronta, ordina — e pubblica ogni settimana uno stato dell'arte, senza fronzoli.

---

## Indice

- [Manifesto](#manifesto)
- [Funzionamento](#funzionamento)
- [Stack tecnico](#stack-tecnico)
- [Insegne](#insegne)
- [Categorie](#categorie)
- [Architettura dei dati](#architettura-dei-dati)
- [Avvio rapido](#avvio-rapido)
- [Variabili d'ambiente](#variabili-dambiente)
- [Database](#database)
- [Scraping](#scraping)
- [Automazione](#automazione)
- [API](#api)
- [Verifiche](#verifiche)
- [Distribuzione](#distribuzione)
- [Pagine legali & link](#pagine-legali--link)

---

## Manifesto

Il discount non è una categoria, è un'etica: trovare il prodotto giusto, al prezzo giusto, nell'insegna giusta, senza perdere un'ora. È esattamente ciò che fa ComparPrix.

- **Un'unica base, dieci insegne.** Tutte le offerte vivono in un'unica fonte di verità; l'interfaccia non scrape mai in modo avventato.
- **Onestà in superficie.** Categorie, prezzi sbarrati, sconti — ogni scheda rispecchia ciò che è nel database, niente di più.
- **Tono redazionale.** *Il Magazine dei Prezzi Discount* è un bollettino. Il design si ispira, il codice lo rispetta.
- **Zero segreti.** Scraper, schemi, script di supervisione: tutto versionato, tutto eseguibile in locale.

> [!TIP]
> ComparPrix **non** è affiliato alle insegne che indicizza. Tutti i marchi citati appartengono ai rispettivi proprietari.

---

## Funzionamento

```text
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Scraper (Playwright / fetch) │ ─► │ PostgreSQL (products + prices) │ ─► │ UI Next.js (revalidate 300s)  │
└────────────────────┘    └────────────────────┘    └────────────────────┘
        ▲                                                       ▲
        │                                                       │
┌────────────────────┐                                  ┌────────────────────┐
│ GitHub Actions (cron + manual)             │                                  │ /api/search con fallback       │
└────────────────────┘                                  └────────────────────┘
```

Tre percorsi di lettura ben separati:

1. **Homepage `/`** — priorità alla lettura dal DB, con fallback live su `search` quando il database restituisce pochi risultati (≤ 5).
2. **Sezione `/deals`** — mostra **esclusivamente** le offerte in promozione salvate nel database. Mai scraping live.
3. **`/api/search`** — endpoint JSON con catena di fallback: `database → real-time → demo-fallback`. Vedi [`src/app/api/search/AGENTS.md`](src/app/api/search/AGENTS.md).

> [!IMPORTANT]
> Gli scraper browser (Action, B&M, Centrakor, Aldi) sono **disattivati automaticamente su Vercel**. Il rendering della pagina delle offerte resta strettamente guidato dal database, così un deploy non avvia mai un browser headless.

---

## Stack tecnico

| Livello | Scelta | Perché |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org) App Router + Turbopack | RSC, ISR (`revalidate = 300s`), `route handler` nativi |
| UI | React 19, Tailwind CSS 3, Framer Motion 12 | Componenti sobri, microanimazioni redazionali |
| Icone | [Lucide](https://lucide.dev) | Set coerente, tree-shakable |
| Ricerca client | [Fuse.js](https://fusejs.io) | Tolleranza ai refusi, pesi regolabili |
| Database | Vercel Postgres (lettura `@vercel/postgres`, scrittura in batch `pg`) | Transazionale, facile da distribuire |
| Scraping | [Playwright](https://playwright.dev) Chromium (browser) + `fetch` nativo (HTML/JSON) | Mix a seconda delle difese dell'insegna |
| Parsing HTML | [Cheerio](https://cheerio.js.org) | Veloce, sintassi jQuery familiare |
| Validazione | `scraper-utils.ts` (parole chiave + dominio + prezzo + identità di origine) | Rifiuti espliciti, mai coercizione silenziosa |
| Tipografia | Bricolage Grotesque, Big Shoulders, Fraunces, JetBrains Mono | Voce redazionale del *Bollettino* |
| Palette | Inchiostro `#0F1623` · Blu navy `#0F2C52` · Blu navy profondo `#081C36` · Crema `#FCFDFE` | Contrasto AAA nella maggior parte delle coppie |

---

## Insegne

Dieci discount, dieci approcci di scraping. La tabella rispecchia la fonte di verità in `src/lib/catalog.ts`:

| Slug | Insegna | Dominio | Tecnologia | Strategia |
| --- | --- | --- | --- | --- |
| `action` | Action | `action.com` | Playwright | Browser (Cloudflare) |
| `stokomani` | Stokomani | `stokomani.fr` | `fetch` + Shopify JSON | Storefront API |
| `bm` | B&M | `bmstores.fr` | Playwright | Browser |
| `centrakor` | Centrakor | `centrakor.com` | Playwright + stato Apollo | Stato GraphQL iniettato |
| `aldi` | Aldi | `aldi.fr` | Playwright | Browser |
| `gifi` | GiFi | `gifi.fr` | `fetch` + HTML / JSON-LD | Fallback multi-formato |
| `lafoirfouille` | La Foir'Fouille | `lafoirfouille.fr` | `fetch` | HTML |
| `lidl` | Lidl | `lidl.fr` | `fetch` | HTML + CDN immagini |
| `maxibazar` | Maxi Bazar | `maxibazar.fr` | `fetch` | HTML |
| `noz` | Noz | `noz.fr` | `fetch` | HTML |

> [!TIP]
> I dettagli di ogni scraper vivono in [`src/lib/scrapers/AGENTS.md`](src/lib/scrapers/AGENTS.md). I `*Detailed` esportano `{ offers, issues, coverage }` — la persistenza è centralizzata in `weekly-scrape.ts`, mai dentro gli scraper.

### Strategia settimanale

Le insegne si dividono in due gruppi:

- **Obbligatorie** — `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`. 3 tentativi, fallimento ⇒ il job si interrompe.
- **Opzionali** — `lafoirfouille`, `lidl`, `maxibazar`, `noz`. 1 tentativo tollerante: una copertura parziale è accettata.

---

## Categorie

Tredici reparti, rigorosamente mappati nel database (SQL `CHECK`) per evitare fughe di categorizzazione.

| Slug | Etichetta | Slug | Etichetta |
| --- | --- | --- | --- |
| `hygiene` | Igiene | `animaux` | Animali |
| `alimentation` | Alimentari | `textile` | Tessile |
| `menage` | Casa | `mode` | Moda |
| `maison-deco` | Casa & deco | `high-tech` | High-tech |
| `jardin` | Giardino | `bazar` | Generico |
| `bricolage` | Fai-da-te | `jouets` | Giocattoli |
| `loisirs` | Tempo libero | | |

> [!NOTE]
> La risoluzione delle categorie privilegia i **metadati nativi** (percorso di origine) rispetto all'inferenza per parole chiave. Il fallback finale è `bazar`, mai un `|| 'menage'` come predefinito.

---

## Architettura dei dati

Due tabelle, due responsabilità:

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

- **Lettura** tramite `@vercel/postgres` (`sql.query`).
- **Scrittura** tramite `pg.Client` in transazioni esplicite, a blocchi da **150 prodotti** / **200 prezzi**.
- **Pulizia**: `pruneStaleOffersByRetailer` elimina le offerte di un'insegna assenti nell'ultimo batch attivo.

Dettagli su schema, regole di validazione e vincoli SQL sono in [`scripts/init-db.ts`](scripts/init-db.ts).

---

## Avvio rapido

> [!IMPORTANT]
> È richiesto **Node ≥ 22.17** (vedi workflow CI). `nvm use 22.17.0` è il tuo migliore alleato.

```bash
# 1. Clona e installa
git clone https://github.com/<owner>/comparateur-prix-discount.git
cd comparateur-prix-discount
npm install

# 2. Predisponi Chromium per gli scraper browser
npx playwright install chromium

# 3. Configura l'ambiente
cp .env.example .env.local
# Modifica .env.local → POSTGRES_URL=...

# 4. (Opzionale ma consigliato) Ricostruisci lo schema
npx tsx scripts/init-db.ts

# 5. Avvia in modalità dev
npm run dev
```

L'app viene servita di default su `http://localhost:3000`.

> [!TIP]
> Senza `POSTGRES_URL` la homepage gira in modalità degradata: l'endpoint `/api/search` passa automaticamente al set demo (22 schede).

---

## Variabili d'ambiente

| Variabile | Richiesta | Descrizione |
| --- | --- | --- |
| `POSTGRES_URL` | consigliata | URL Vercel Postgres (preferita). |
| `DATABASE_URL` | alias | Accettata come equivalente; normalizzata a `POSTGRES_URL` all'avvio. |
| `VERCEL_ENABLE_POSTBUILD_SCRAPE` | opzionale | Attiva l'hook postbuild (vedi [Distribuzione](#distribuzione)). Lasciala vuota/di default nel funzionamento normale. |

Il modulo `src/lib/ensure-db-env.ts` armonizza i due nomi per evitare sorprese tra locale e CI.

---

## Database

### Inizializzazione (distruttiva)

```bash
npx tsx scripts/init-db.ts
```

Lo script **distrugge** e ricrea le tabelle `products` e `prices`, con vincoli `CHECK` su insegne e categorie supportate. Da usare al primo deploy o per un reset completo.

> [!WARNING]
> Questa operazione è **distruttiva**. Non eseguirla mai senza uno snapshot preventivo su un database con dati di produzione.

### Migrazioni future

Il progetto non utilizza ancora uno strumento di migrazione incrementale (Drizzle, Prisma, ecc.). Le evoluzioni dello schema sono distribuite, fino a decisione contraria, come nuovi script sotto `scripts/`.

---

## Scraping

### Scrape settimanale completo

```bash
npm run scrape
```

Orchestrazione:

- **Lettura** di tutte e dieci le insegne con scraping reale.
- **Validazione** tramite `scraper-utils.ts` (rifiuta `missing_name`, `wrong_domain`, `invalid_price`, `duplicate_offer`, ecc.).
- **Persistenza** nel database tramite batch transazionali.
- **Report**: `scrape-results.json` (riepilogo macchina) e `scrape-history.log` (cronologia umana).

### Scrape mirato delle offerte

```bash
npm run scrape:deals
# oppure per un'insegna specifica:
npm run scrape:deals action,aldi
```

Filtra le offerte in promozione (tramite `isPromotionalOffer`) e salva solo le occasioni.

### Scrape per insegna

```bash
npm run scrape:gifi
npm run scrape:lafoirfouille
npm run scrape:lidl
npm run scrape:maxibazar
npm run scrape:noz
npm run fix:gifi-images
```

### Supervisione (audit di copertura)

```bash
npm run supervise               # tutte le insegne
npm run supervise:gifi          # un'insegna specifica
```

Produce `supervision-results.json`, `supervision-report.txt` e alimenta `supervision-history.log`. Ideale dopo un cambio di selettore o un blocco upstream.

> [!TIP]
> Esegui `npm run supervise` dopo ogni modifica a uno scraper per misurare le regressioni prima di aprire una PR.

---

## Automazione

Due workflow GitHub Actions:

| Workflow | Trigger | Effetto |
| --- | --- | --- |
| `.github/workflows/daily-full-scrape.yml` | Cron (con controllo TZ Europe/Paris) | Scrape settimanale completo + persistenza DB |
| `.github/workflows/deals-scrape.yml` | `workflow_dispatch` (manuale) | Refresh on-demand delle offerte |

Entrambi i workflow usano lo stesso runner Node 22.17 e si appoggiano a `npx tsx` per eseguire direttamente gli script TypeScript, senza passaggio di build aggiuntivo.

---

## API

| Endpoint | Metodo | Descrizione |
| --- | --- | --- |
| `/api/search` | `GET` | Ricerca multi-fonte (DB → live → demo). Parametri query: `query`, `category`, `retailer`, `minPrice`, `maxPrice`, `sort`. |
| `/api/deals` | `GET` | Offerte esclusivamente dal database. |
| `/api/produit` | `GET` | Dettaglio offerta normalizzato, pronto per la condivisione. |

Tutti gli endpoint sono marcati `dynamic = 'force-dynamic'` e restituiscono un payload JSON stabile. La forma delle risposte è documentata in `AGENTS.md` alla radice di ogni cartella.

---

## Verifiche

```bash
npm run lint             # ESLint (next/core-web-vitals)
npm run typecheck        # tsc --noEmit per app + script
npm run test:categories  # suite integrata Node via tsx
```

> [!IMPORTANT]
> Il `typecheck` controlla **entrambi** i tsconfig: `tsconfig.json` (codice applicativo) e `tsconfig.scripts.json` (script operativi). Entrambi devono restare verdi prima di ogni PR.

---

## Distribuzione

Obiettivo: **Vercel**, database Vercel Postgres, scraping su GitHub Actions.

```text
         ┌──────────────────────┐
         │      GitHub repo      │
         └──────────┬───────────┘
                    │ push
                    ▼
         ┌──────────────────────┐
         │  Vercel (build)      │
         │  next build          │
         │  postbuild (disattivato)│
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Vercel Postgres     │ ◄── daily-full-scrape.yml (cron)
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Sito di produzione  │ ◄── ISR (revalidate 300s)
         └──────────────────────┘
```

### Hook `postbuild`

Il `package.json` espone un `postbuild` (`scripts/vercel-postbuild-scrape.mjs`):

- **Disattivato di default** — `VERCEL_ENABLE_POSTBUILD_SCRAPE` deve valere `'1'` per innescare lo scraping durante un deploy.
- **Consigliato:** lascia l'hook **disattivato** nel funzionamento normale. Lo scraping gira in parallelo tramite il cron di GitHub Actions, per disaccoppiare build e ingestion.

### Procedura per il primo deploy

1. Predisponi Vercel Postgres.
2. Registra `POSTGRES_URL` nelle variabili d'ambiente Vercel.
3. Esegui `npx tsx scripts/init-db.ts` contro il database di produzione (da un runner autorizzato).
4. Lancia un primo `npm run scrape` per popolare i dati.
5. Verifica la copertura per insegna: `npm run supervise`.
6. Attiva la pianificazione GitHub Actions (`daily-full-scrape.yml`).

---

## Pagine legali & link

Il footer dell'app punta alle seguenti pagine, servite dall'App Router:

- `/` — Ricerca prodotti
- `/deals` — Offerte del momento
- `/a-propos` — Manifesto
- `/faq` — Domande frequenti
- `/cgu` — Condizioni generali d'uso
- `/cookies` — Politica dei cookie
- `/mentions-legales` — Note legali
- `/politique-confidentialite` — Informativa sulla privacy

> [!NOTE]
> I file `LICENSE`, `CONTRIBUTING` e `CHANGELOG` (se presenti) sono deliberatamente esclusi da questo README: vivono nella radice del repo per restare reperibili da GitHub.

---

<p align="center">
  <sub>№ 01 — Ogni settimana · 10 insegne · 13 categorie · <a href="public/brand/concept-2-etiquette/horizontal.svg">L'Étiquette</a> scelta come firma visiva.</sub>
</p>
