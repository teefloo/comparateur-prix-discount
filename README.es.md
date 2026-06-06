<p align="center">
  <img src="public/logo.png" alt="ComparPrix" width="160" />
</p>

<h1 align="center">ComparPrix</h1>

<p align="center">
  <em>El Boletín de Precios Discount — № 01, Semanal.</em>
</p>

<p align="center">
  <a href="#funcionamiento"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-App%20Router-0F1623?style=flat-square&logo=nextdotjs&logoColor=FCFDFE" /></a>
  <a href="#stack-t%C3%A9cnico"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=FCFDFE" /></a>
  <a href="#base-de-datos"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Vercel-336791?style=flat-square&logo=postgresql&logoColor=FCFDFE" /></a>
  <a href="#scraping"><img alt="Playwright" src="https://img.shields.io/badge/Playwright-Chromium-2EAD33?style=flat-square&logo=playwright&logoColor=FCFDFE" /></a>
  <a href="#inicio-r%C3%A1pido"><img alt="Node 22" src="https://img.shields.io/badge/Node-%E2%89%A522.17-339933?style=flat-square&logo=nodedotjs&logoColor=FCFDFE" /></a>
  <a href="LICENSE"><img alt="Licencia" src="https://img.shields.io/badge/License-SEE%20LICENSE%20IN%20FILE-0F2C52?style=flat-square" /></a>
</p>

<p align="center">
  <a href="#inicio-r%C3%A1pido">Inicio rápido</a> ·
  <a href="#stack-t%C3%A9cnico">Stack</a> ·
  <a href="#establecimientos">Establecimientos</a> ·
  <a href="#categor%C3%ADas">Categorías</a> ·
  <a href="#scraping">Scraping</a> ·
  <a href="#automatizaci%C3%B3n">GitHub Actions</a> ·
  <a href="#despliegue">Despliegue</a>
</p>

<!-- README-I18N:START -->

[Français](./README.md) | [English](./README.en.md) | **[Español](./README.es.md)** | [Deutsch](./README.de.md) | [Italiano](./README.it.md)

<!-- README-I18N:END -->

---

> [!NOTE]
> **El boletín de caza de gangas.** Una sola lista, **diez establecimientos discount**, y siempre el mejor precio al alcance. ComparPrix lee, compara, clasifica — y luego publica un estado de la cuestión semanal, sin florituras.

---

## Contenido

- [Manifiesto](#manifiesto)
- [Funcionamiento](#funcionamiento)
- [Stack técnico](#stack-t%C3%A9cnico)
- [Establecimientos](#establecimientos)
- [Categorías](#categor%C3%ADas)
- [Arquitectura de datos](#arquitectura-de-datos)
- [Inicio rápido](#inicio-r%C3%A1pido)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Scraping](#scraping)
- [Automatización](#automatizaci%C3%B3n)
- [API](#api)
- [Verificaciones](#verificaciones)
- [Despliegue](#despliegue)
- [Páginas legales y enlaces](#p%C3%A1ginas-legales-y-enlaces)

---

## Manifiesto

El discount no es una categoría, es un estado mental: buscar el producto adecuado, al precio justo, en el establecimiento correcto, sin perder una hora. ComparPrix hace exactamente eso.

- **Una base, diez establecimientos.** Todas las ofertas persisten en una única fuente de verdad; la UI nunca scrapea sobre la marcha.
- **Honestidad de superficie.** Categorías, precios tachados, descuentos — cada tarjeta refleja lo que está en la base, nada más.
- **Tono editorial.** *El Boletín de Precios Discount* es un cuaderno de bitácora. La estética se inspira, el código lo respeta.
- **Cero secretos.** Scrapers, esquemas, scripts de supervisión: todo versionado, todo ejecutable en local.

> [!TIP]
> ComparPrix **no** está afiliado a los establecimientos que indexa. Todas las marcas mencionadas pertenecen a sus respectivos propietarios.

---

## Funcionamiento

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

Tres rutas de lectura bien separadas:

1. **Página de inicio `/`** — Lectura de la BD en prioridad, con fallback a `search` en tiempo real si la base devuelve pocos resultados (≤ 5).
2. **Sección `/deals`** — Muestra **únicamente** las ofertas promocionales persistidas en la base. Nunca scraping en vivo.
3. **`/api/search`** — Endpoint JSON con cadena de respaldo: `database → real-time → demo-fallback`. Ver [`src/app/api/search/AGENTS.md`](src/app/api/search/AGENTS.md).

> [!IMPORTANT]
> Los scrapers de navegador (Action, B&M, Centrakor, Aldi) se **desactivan automáticamente en Vercel**. El renderizado de la página de Ofertas sigue basándose estrictamente en la base, lo que garantiza que un despliegue nunca lance un navegador headless.

---

## Stack técnico

| Capa | Elección | Por qué |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org) App Router + Turbopack | RSC, ISR (`revalidate = 300s`), `route handlers` nativos |
| UI | React 19, Tailwind CSS 3, Framer Motion 12 | Componentes sobrios, microanimaciones editoriales |
| Iconos | [Lucide](https://lucide.dev) | Set coherente, tree-shakable |
| Búsqueda cliente | [Fuse.js](https://fusejs.io) | Tolerancia tipográfica, ponderable |
| Base de datos | Vercel Postgres (lectura `@vercel/postgres`, escritura batch `pg`) | Transaccional, fácil de aprovisionar |
| Scraping | [Playwright](https://playwright.dev) Chromium (navegador) + `fetch` nativo (HTML/JSON) | Mix según las defensas de cada establecimiento |
| Parseo HTML | [Cheerio](https://cheerio.js.org) | Rápido, sintaxis jQuery familiar |
| Validación | `scraper-utils.ts` (palabra clave + dominio + precio + identidad de fuente) | Rechazos explícitos, nunca coerción silenciosa |
| Tipografía | Bricolage Grotesque, Big Shoulders, Fraunces, JetBrains Mono | Voz editorial de *El Boletín* |
| Paleta | Ink `#0F1623` · Navy `#0F2C52` · Navy-deep `#081C36` · Cream `#FCFDFE` | Contraste AAA en la mayoría de los pares |

---

## Establecimientos

Diez discounters, diez enfoques de scraping. La tabla refleja la fuente de verdad de `src/lib/catalog.ts`:

| Slug | Establecimiento | Dominio | Tecnología | Estrategia |
| --- | --- | --- | --- | --- |
| `action` | Action | `action.com` | Playwright | Navegador (Cloudflare) |
| `stokomani` | Stokomani | `stokomani.fr` | `fetch` + Shopify JSON | Storefront API |
| `bm` | B&M | `bmstores.fr` | Playwright | Navegador |
| `centrakor` | Centrakor | `centrakor.com` | Playwright + Apollo state | Estado GraphQL inyectado |
| `aldi` | Aldi | `aldi.fr` | Playwright | Navegador |
| `gifi` | GiFi | `gifi.fr` | `fetch` + HTML / JSON-LD | Fallback multiformato |
| `lafoirfouille` | La Foir'Fouille | `lafoirfouille.fr` | `fetch` | HTML |
| `lidl` | Lidl | `lidl.fr` | `fetch` | HTML + CDN imágenes |
| `maxibazar` | Maxi Bazar | `maxibazar.fr` | `fetch` | HTML |
| `noz` | Noz | `noz.fr` | `fetch` | HTML |

> [!TIP]
> El detalle de cada scraper está en [`src/lib/scrapers/AGENTS.md`](src/lib/scrapers/AGENTS.md). Los `*Detailed` exportan `{ offers, issues, coverage }` — la persistencia está centralizada en `weekly-scrape.ts`, nunca dentro de los scrapers.

### Estrategia semanal

Los establecimientos se reparten en dos grupos:

- **Requeridos** — `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`. 3 intentos, fallo ⇒ el job da error.
- **Opcionales** — `lafoirfouille`, `lidl`, `maxibazar`, `noz`. 1 intento tolerante: se acepta la cobertura parcial.

---

## Categorías

Trece secciones, mapeadas estrictamente en la base (`CHECK` SQL) para evitar fugas de categorización.

| Slug | Etiqueta | Slug | Etiqueta |
| --- | --- | --- | --- |
| `hygiene` | Higiene | `animaux` | Animales |
| `alimentation` | Alimentación | `textile` | Textil |
| `menage` | Hogar | `mode` | Moda |
| `maison-deco` | Casa y Deco | `high-tech` | High-Tech |
| `jardin` | Jardín | `bazar` | Bazar |
| `bricolage` | Bricolaje | `jouets` | Juguetes |
| `loisirs` | Ocio | | |

> [!NOTE]
> La resolución de categoría prioriza los **metadatos nativos** (ruta de origen) sobre la inferencia por palabras clave. El fallback final es `bazar`, nunca un `|| 'menage'` por defecto.

---

## Arquitectura de datos

Dos tablas, dos responsabilidades:

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

- **Lectura** mediante `@vercel/postgres` (`sql.query`).
- **Escritura** mediante `pg.Client` en transacciones explícitas, fragmentadas en **150 productos** / **200 precios**.
- **Poda**: `pruneStaleOffersByRetailer` elimina las ofertas de un establecimiento ausentes del último lote activo.

El detalle del esquema, las reglas de validación y las restricciones SQL está en [`scripts/init-db.ts`](scripts/init-db.ts).

---

## Inicio rápido

> [!IMPORTANT]
> Se requiere **Node ≥ 22.17** (ver workflows de CI). `nvm use 22.17.0` es tu mejor aliado.

```bash
# 1. Clonar e instalar
git clone https://github.com/<owner>/comparateur-prix-discount.git
cd comparateur-prix-discount
npm install

# 2. Preparar Chromium para los scrapers de navegador
npx playwright install chromium

# 3. Configurar el entorno
cp .env.example .env.local
# editar .env.local → POSTGRES_URL=...

# 4. (Opcional pero recomendado) reconstruir el esquema
npx tsx scripts/init-db.ts

# 5. Lanzar en dev
npm run dev
```

La aplicación se sirve en `http://localhost:3000` por defecto.

> [!TIP]
> Sin `POSTGRES_URL`, la página de inicio funciona en modo degradado: el endpoint `/api/search` conmutará automáticamente al conjunto de demostración (22 tarjetas).

---

## Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `POSTGRES_URL` | recomendada | URL de Postgres en Vercel (preferida). |
| `DATABASE_URL` | alias | Aceptada como equivalente; normalizada a `POSTGRES_URL` al arrancar. |
| `VERCEL_ENABLE_POSTBUILD_SCRAPE` | opcional | Activa el hook de postbuild (ver [Despliegue](#despliegue)). Dejar vacía/por defecto en producción normal. |

El módulo `src/lib/ensure-db-env.ts` armoniza ambos nombres, lo que evita sorpresas entre local y CI.

---

## Base de datos

### Inicialización (destructiva)

```bash
npx tsx scripts/init-db.ts
```

El script **destruye** y luego recrea las tablas `products` y `prices`, con restricciones `CHECK` sobre los establecimientos y categorías soportados. Úsalo en el primer despliegue o para un reset completo.

> [!WARNING]
> Esta operación es **destructiva**. Nunca debe ejecutarse contra una base con datos de producción sin una instantánea previa.

### Migraciones futuras

El proyecto aún no utiliza una herramienta de migración incremental (Drizzle, Prisma, etc.). Cualquier evolución del esquema se realiza mediante un nuevo script bajo `scripts/` hasta que se decida lo contrario.

---

## Scraping

### Scrape semanal completo

```bash
npm run scrape
```

Orquestación:

- **Lectura** de los diez establecimientos con scraping real.
- **Validación** mediante `scraper-utils.ts` (rechaza `missing_name`, `wrong_domain`, `invalid_price`, `duplicate_offer`, etc.).
- **Persistencia** en la base mediante batches transaccionales.
- **Informes**: `scrape-results.json` (resumen máquina) y `scrape-history.log` (cronología humana).

### Scrape de ofertas dirigido

```bash
npm run scrape:deals
# o para un establecimiento concreto:
npm run scrape:deals action,aldi
```

Filtra las ofertas promocionales (vía `isPromotionalOffer`) y persiste únicamente los deals.

### Scrape por establecimiento

```bash
npm run scrape:gifi
npm run scrape:lafoirfouille
npm run scrape:lidl
npm run scrape:maxibazar
npm run scrape:noz
npm run fix:gifi-images
```

### Supervisión (auditoría de cobertura)

```bash
npm run supervise               # todos los establecimientos
npm run supervise:gifi          # un establecimiento concreto
```

Genera `supervision-results.json`, `supervision-report.txt` y alimenta `supervision-history.log`. Ideal tras un cambio de selector o un bloqueo upstream.

> [!TIP]
> Lanza `npm run supervise` tras cada modificación de scraper para medir la regresión antes de abrir un PR.

---

## Automatización

Dos workflows de GitHub Actions:

| Workflow | Disparador | Efecto |
| --- | --- | --- |
| `.github/workflows/daily-full-scrape.yml` | Cron (con guarda TZ Europe/Paris) | Scrape semanal completo + persistencia en BD |
| `.github/workflows/deals-scrape.yml` | `workflow_dispatch` (manual) | Refresco de ofertas bajo demanda |

Ambos workflows comparten el mismo runner Node 22.17 y usan `npx tsx` para ejecutar los scripts TypeScript directamente, sin un paso de build adicional.

---

## API

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/search` | `GET` | Búsqueda multi-fuente (BD → live → demo). Query params: `query`, `category`, `retailer`, `minPrice`, `maxPrice`, `sort`. |
| `/api/deals` | `GET` | Ofertas obtenidas únicamente de la base. |
| `/api/produit` | `GET` | Detalle de oferta normalizada para compartir. |

Todos los endpoints están marcados como `dynamic = 'force-dynamic'` y devuelven un payload JSON estable. La forma de las respuestas está documentada en `AGENTS.md` en la raíz de cada carpeta.

---

## Verificaciones

```bash
npm run lint             # ESLint (next/core-web-vitals)
npm run typecheck        # tsc --noEmit sobre app + scripts
npm run test:categories  # suite Node built-in vía tsx
```

> [!IMPORTANT]
> El `typecheck` revisa **ambos** tsconfigs: `tsconfig.json` (código de aplicación) y `tsconfig.scripts.json` (scripts de operación). Ambos deben permanecer en verde antes de cada PR.

---

## Despliegue

Objetivo: **Vercel**, base Vercel Postgres, scraping en GitHub Actions.

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

`package.json` expone un `postbuild` (`scripts/vercel-postbuild-scrape.mjs`):

- **Inactivo por defecto** — `VERCEL_ENABLE_POSTBUILD_SCRAPE` debe valer `'1'` para lanzar el scrape durante un despliegue.
- **Recomendado:** mantener el hook **desactivado** en producción normal. El scraping se ejecuta en paralelo mediante el cron de GitHub Actions para desacoplar build e ingestión.

### Procedimiento de primer despliegue

1. Aprovisionar Vercel Postgres.
2. Introducir `POSTGRES_URL` en las variables de entorno de Vercel.
3. `npx tsx scripts/init-db.ts` contra la base de prod (desde un runner autorizado).
4. Lanzar un `npm run scrape` inicial para sembrar los datos.
5. Verificar la cobertura por establecimiento: `npm run supervise`.
6. Activar la planificación de GitHub Actions (`daily-full-scrape.yml`).

---

## Páginas legales y enlaces

El footer de la aplicación referencia las siguientes páginas, servidas por el App Router:

- `/` — Búsqueda de productos
- `/deals` — Ofertas del momento
- `/a-propos` — Manifiesto
- `/faq` — Preguntas frecuentes
- `/cgu` — Condiciones generales de uso
- `/cookies` — Política de cookies
- `/mentions-legales` — Aviso legal
- `/politique-confidentialite` — Política de privacidad

> [!NOTE]
> Los archivos `LICENSE`, `CONTRIBUTING` y `CHANGELOG` (si existen) se excluyen intencionadamente de este README: viven en la raíz del repositorio para permanecer localizables por GitHub.

---

<p align="center">
  <sub>№ 01 — Semanal · 10 establecimientos · 13 categorías · <a href="public/brand/concept-2-etiquette/horizontal.svg">L'Étiquette</a> adoptada como firma visual.</sub>
</p>
