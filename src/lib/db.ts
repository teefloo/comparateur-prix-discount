import { sql } from '@vercel/postgres'
import { unstable_cache } from 'next/cache'
import pg from 'pg'

import { RETAILERS, SUPPORTED_CATEGORIES, type Retailer, type SupportedCategory } from './catalog'
import { ensureDatabaseUrlEnv, hasDatabaseUrl } from './ensure-db-env'
import { type PriceSortOption } from './result-filters'
import { normalizeRetailerSelection, normalizeSearchQuery, toRetailerOfferCard } from './scraper-utils'
import type { RetailerOfferCard, ValidatedOffer } from './types'

ensureDatabaseUrlEnv()

const { Client } = pg

type OfferDbRow = {
  id: string
  store_id: RetailerOfferCard['retailer']
  source_product_id: string
  source_url: string
  source_category_path: string | null
  name: string
  category: SupportedCategory
  brand: string | null
  image: string | null
  description: string | null
  availability: string | null
  quantity: string | null
  unit_price: string | null
  last_scraped_at: Date | string | null
  price: unknown
  original_price: unknown
  discount: number | null
  is_on_promotion: boolean | null
  updated_at: Date | string | null
}

export type DealCoverageByRetailer = Record<Retailer, number>

const PRODUCT_COLUMNS = [
  'id',
  'store_id',
  'source_product_id',
  'source_url',
  'source_category_path',
  'name',
  'category',
  'brand',
  'image',
  'description',
  'availability',
  'quantity',
  'unit_price',
  'last_scraped_at',
] as const

const PRICE_COLUMNS = [
  'product_id',
  'price',
  'original_price',
  'discount',
  'is_on_promotion',
  'updated_at',
] as const

const PRODUCT_CATEGORY_CONSTRAINT_NAME = 'products_category_check'
const PRODUCT_CATEGORY_CHECK_VALUES = SUPPORTED_CATEGORIES.map((category) => `'${category}'`).join(', ')
const PRODUCT_RETAILER_CONSTRAINT_NAME = 'products_store_check'
const PRODUCT_RETAILER_CHECK_VALUES = RETAILERS.map((retailer) => `'${retailer}'`).join(', ')

let hasEnsuredProductCategoryConstraint = false
let hasEnsuredProductRetailerConstraint = false

const SQL_ACCENT_SOURCE = 'àáâãäåāăąçćčèéêëēĕėęěìíîïīĭįñńňòóôõöøōŏőùúûüūŭůűųýÿ'
const SQL_ACCENT_TARGET = 'aaaaaaaaaccceeeeeeeeiiiiiiinnnoooooooouuuuuuuuuuuyy'

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }

  return chunks
}

function buildPlaceholders(rowCount: number, columnCount: number) {
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const base = rowIndex * columnCount
    const placeholders = Array.from({ length: columnCount }, (_, columnIndex) => `$${base + columnIndex + 1}`)
    return `(${placeholders.join(', ')})`
  }).join(', ')
}

function dedupeOffersBySource<T extends { retailer: RetailerOfferCard['retailer']; sourceProductId: string }>(
  offers: T[],
): T[] {
  const deduped = new Map<string, T>()

  for (const offer of offers) {
    deduped.set(`${offer.retailer}:${offer.sourceProductId}`, offer)
  }

  return Array.from(deduped.values())
}

async function resolvePersistedOfferIds(
  client: InstanceType<typeof Client>,
  offers: ValidatedOffer[],
): Promise<ValidatedOffer[]> {
  const dedupedOffers = dedupeOffersBySource(offers)
  const sourceIdsByRetailer = new Map<RetailerOfferCard['retailer'], string[]>()

  for (const offer of dedupedOffers) {
    const sourceIds = sourceIdsByRetailer.get(offer.retailer) || []
    sourceIds.push(offer.sourceProductId)
    sourceIdsByRetailer.set(offer.retailer, sourceIds)
  }

  const existingIds = new Map<string, string>()

  for (const [retailer, sourceProductIds] of sourceIdsByRetailer.entries()) {
    if (sourceProductIds.length === 0) continue

    const { rows } = await client.query<{ id: string; source_product_id: string }>(
      `
        SELECT id, source_product_id
        FROM products
        WHERE store_id = $1
          AND source_product_id = ANY($2::text[])
      `,
      [retailer, sourceProductIds],
    )

    for (const row of rows) {
      existingIds.set(`${retailer}:${row.source_product_id}`, row.id)
    }
  }

  return dedupedOffers.map((offer) => {
    const existingId = existingIds.get(`${offer.retailer}:${offer.sourceProductId}`)
    return existingId ? { ...offer, id: existingId } : offer
  })
}

function mapOfferRow(row: OfferDbRow): RetailerOfferCard {
  const lastUpdated =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : row.updated_at
        ? new Date(row.updated_at).toISOString()
        : null

  return toRetailerOfferCard({
    id: row.id,
    retailer: row.store_id,
    name: row.name,
    category: row.category,
    brand: row.brand,
    price: typeof row.price === 'number' ? row.price : Number.parseFloat(String(row.price)),
    image: row.image,
    description: row.description,
    availability: row.availability,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    originalPrice:
      row.original_price === null || row.original_price === undefined
        ? undefined
        : typeof row.original_price === 'number'
          ? row.original_price
          : Number.parseFloat(String(row.original_price)),
    isOnPromotion: row.is_on_promotion,
    discount: row.discount,
    lastUpdated,
    sourceUrl: row.source_url,
  })
}

function createDbClient() {
  const connectionString = ensureDatabaseUrlEnv()
  if (!connectionString) {
    throw new Error('POSTGRES_URL or DATABASE_URL is required for DB writes')
  }

  return new Client({ connectionString })
}

async function ensureProductCategoryConstraint(client: InstanceType<typeof Client>) {
  if (hasEnsuredProductCategoryConstraint) {
    return
  }

  const { rows } = await client.query<{ constraintdef: string | null }>(
    `
      SELECT pg_get_constraintdef(c.oid) AS constraintdef
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'products'
        AND c.conname = $1
      LIMIT 1
    `,
    [PRODUCT_CATEGORY_CONSTRAINT_NAME],
  )

  const currentDefinition = rows[0]?.constraintdef || ''
  const isCurrentConstraint =
    currentDefinition.length > 0 &&
    SUPPORTED_CATEGORIES.every((category) => currentDefinition.includes(`'${category}'`))

  if (!isCurrentConstraint) {
    await client.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS ${PRODUCT_CATEGORY_CONSTRAINT_NAME}`)
    await client.query(
      `
        ALTER TABLE products
        ADD CONSTRAINT ${PRODUCT_CATEGORY_CONSTRAINT_NAME}
        CHECK (category IN (${PRODUCT_CATEGORY_CHECK_VALUES}))
      `,
    )
  }

  hasEnsuredProductCategoryConstraint = true
}

function buildNormalizedSqlTextExpression(columnSql: string) {
  return `regexp_replace(translate(lower(coalesce(${columnSql}, '')), '${SQL_ACCENT_SOURCE}', '${SQL_ACCENT_TARGET}'), '[^a-z0-9]+', ' ', 'g')`
}

function buildEmptyDealCoverage(): DealCoverageByRetailer {
  return RETAILERS.reduce(
    (acc, retailer) => {
      acc[retailer] = 0
      return acc
    },
    {} as DealCoverageByRetailer,
  )
}

function buildDealFilterClauses(options: {
  query?: string | null
  category?: SupportedCategory | null
  retailer?: string | string[] | null
  promotionOnly?: boolean
}) {
  const whereClauses: string[] = []
  const values: Array<string | number | string[]> = []

  if (options.query) {
    const normalizedQuery = normalizeSearchQuery(options.query)
    if (normalizedQuery) {
      values.push(`%${normalizedQuery}%`)
      const placeholder = `$${values.length}`
      const normalizedName = buildNormalizedSqlTextExpression('p.name')
      const normalizedBrand = buildNormalizedSqlTextExpression('COALESCE(p.brand, \'\')')
      const normalizedDescription = buildNormalizedSqlTextExpression('COALESCE(p.description, \'\')')
      whereClauses.push(
        `(${normalizedName} LIKE ${placeholder} OR ${normalizedBrand} LIKE ${placeholder} OR ${normalizedDescription} LIKE ${placeholder})`,
      )
    }
  }

  if (options.category) {
    values.push(options.category)
    whereClauses.push(`p.category = $${values.length}`)
  }

  const retailers = normalizeRetailerSelection(options.retailer)
  if (retailers.length === 1) {
    values.push(retailers[0])
    whereClauses.push(`p.store_id = $${values.length}`)
  } else if (retailers.length > 1) {
    values.push(retailers)
    whereClauses.push(`p.store_id = ANY($${values.length}::text[])`)
  }

  if (options.promotionOnly) {
    whereClauses.push(`pr.is_on_promotion = TRUE`)
  }

  const whereStatement = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  return { whereStatement, values, retailers }
}

async function ensureProductRetailerConstraint(client: InstanceType<typeof Client>) {
  if (hasEnsuredProductRetailerConstraint) {
    return
  }

  const { rows } = await client.query<{ conname: string; constraintdef: string | null }>(
    `
      SELECT c.conname, pg_get_constraintdef(c.oid) AS constraintdef
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'products'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) LIKE '%store_id%'
    `,
  )

  const currentConstraint = rows.find((row) => {
    const definition = row.constraintdef || ''
    return RETAILERS.every((retailer) => definition.includes(`'${retailer}'`))
  })

  if (!currentConstraint) {
    for (const row of rows) {
      await client.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS ${row.conname}`)
    }

    await client.query(
      `
        ALTER TABLE products
        ADD CONSTRAINT ${PRODUCT_RETAILER_CONSTRAINT_NAME}
        CHECK (store_id IN (${PRODUCT_RETAILER_CHECK_VALUES}))
      `,
    )
  }

  hasEnsuredProductRetailerConstraint = true
}

async function queryOffers(options: {
  query?: string
  category?: SupportedCategory | null
  limit?: number
  id?: string
  retailer?: string | string[] | null
  promotionOnly?: boolean
  sortByDeals?: boolean
  sort?: Exclude<PriceSortOption, 'default'>
}) {
  const whereClauses: string[] = []
  const values: Array<string | number | string[]> = []
  const connectionString = ensureDatabaseUrlEnv()

  if (!connectionString) {
    throw new Error('POSTGRES_URL or DATABASE_URL is required for DB queries')
  }

  if (options.id) {
    values.push(options.id)
    whereClauses.push(`p.id = $${values.length}`)
  }

  if (options.query) {
    const normalizedQuery = normalizeSearchQuery(options.query)
    if (normalizedQuery) {
      values.push(`%${normalizedQuery}%`)
      const placeholder = `$${values.length}`
      const normalizedName = buildNormalizedSqlTextExpression('p.name')
      const normalizedBrand = buildNormalizedSqlTextExpression('COALESCE(p.brand, \'\')')
      const normalizedDescription = buildNormalizedSqlTextExpression('COALESCE(p.description, \'\')')
      whereClauses.push(
        `(${normalizedName} LIKE ${placeholder} OR ${normalizedBrand} LIKE ${placeholder} OR ${normalizedDescription} LIKE ${placeholder})`,
      )
    }
  }

  if (options.category) {
    values.push(options.category)
    whereClauses.push(`p.category = $${values.length}`)
  }

  if (options.retailer) {
    const retailers = Array.isArray(options.retailer)
      ? options.retailer
      : options.retailer.includes(',')
        ? options.retailer.split(',').map((value) => value.trim()).filter(Boolean)
        : [options.retailer]

    if (retailers.length === 1) {
      values.push(retailers[0])
      whereClauses.push(`p.store_id = $${values.length}`)
    } else if (retailers.length > 1) {
      values.push(retailers)
      whereClauses.push(`p.store_id = ANY($${values.length}::text[])`)
    }
  }

  if (options.promotionOnly) {
    whereClauses.push(`pr.is_on_promotion = TRUE`)
  }

  values.push(options.limit || 100)
  const limitPlaceholder = `$${values.length}`
  const whereStatement = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const query = `
    SELECT
      p.id,
      p.store_id,
      p.source_product_id,
      p.source_url,
      p.source_category_path,
      p.name,
      p.category,
      p.brand,
      p.image,
      p.description,
      p.availability,
      p.quantity,
      p.unit_price,
      p.last_scraped_at,
      pr.price,
      pr.original_price,
      pr.discount,
      pr.is_on_promotion,
      pr.updated_at
    FROM products p
    JOIN prices pr ON pr.product_id = p.id
    ${whereStatement}
    ${
      options.sort === 'price-desc'
        ? 'ORDER BY pr.price DESC, p.name ASC'
        : options.sort === 'price-asc'
          ? 'ORDER BY pr.price ASC, p.name ASC'
          : options.sortByDeals
            ? 'ORDER BY COALESCE(pr.discount, 0) DESC, pr.updated_at DESC, pr.price ASC, p.name ASC'
            : 'ORDER BY pr.price ASC, p.name ASC'
    }
    LIMIT ${limitPlaceholder}
  `

  const { rows } = await sql.query(query, values)
  return (rows as OfferDbRow[]).map(mapOfferRow)
}

export async function searchOffersInDb(query: string, category?: SupportedCategory | null, retailer?: string | null) {
  if (!hasDatabaseUrl()) {
    return []
  }

  try {
    return await queryOffers({ query, category, limit: 120, retailer })
  } catch (error) {
    console.error('DB Error in searchOffersInDb:', error)
    return []
  }
}

export async function searchOffersInDbStrict(
  query: string,
  category?: SupportedCategory | null,
  retailer?: string | null,
  sort?: PriceSortOption,
) {
  return queryOffers({
    query,
    category,
    limit: 120,
    retailer,
    sort: sort === 'price-asc' || sort === 'price-desc' ? sort : undefined,
  })
}

const categoryOfferCache = new Map<
  SupportedCategory,
  (limit: number, retailer: string | undefined, sort: PriceSortOption | undefined) => Promise<RetailerOfferCard[]>
>()

function getCachedCategoryOffers(category: SupportedCategory) {
  const existing = categoryOfferCache.get(category)
  if (existing) {
    return existing
  }

  const cached = unstable_cache(
    (limit: number, retailer: string | undefined, sort: PriceSortOption | undefined) =>
      queryOffers({
        category,
        limit,
        retailer: retailer ?? null,
        sort: sort === 'price-asc' || sort === 'price-desc' ? sort : undefined,
      }),
    ['offers-by-category-v1', category],
    { revalidate: 600, tags: ['products', `cat:${category}`] },
  )

  categoryOfferCache.set(category, cached)
  return cached
}

export async function getOffersByCategory(
  category: SupportedCategory,
  limit = 5000,
  retailer?: string | null,
  sort?: PriceSortOption,
) {
  if (!hasDatabaseUrl()) {
    return []
  }

  try {
    const cached = getCachedCategoryOffers(category)
    return await cached(limit, retailer ?? undefined, sort ?? undefined)
  } catch (error) {
    console.error('DB Error in getOffersByCategory:', error)
    return []
  }
}

export async function getOffersByCategoryStrict(
  category: SupportedCategory,
  limit = 5000,
  retailer?: string | null,
  sort?: PriceSortOption,
) {
  const cached = getCachedCategoryOffers(category)
  return cached(limit, retailer ?? undefined, sort ?? undefined)
}

export async function getOfferById(id: string) {
  if (!hasDatabaseUrl()) {
    return null
  }

  try {
    const rows = await queryOffers({ id, limit: 1 })
    return rows[0] || null
  } catch (error) {
    console.error('DB Error in getOfferById:', error)
    return null
  }
}

export async function getDealsInDb(
  category?: SupportedCategory | null,
  limit = 500,
  retailer?: string | string[] | null,
  query?: string | null,
  sort?: PriceSortOption,
) {
  if (!hasDatabaseUrl()) {
    return []
  }

  try {
    return await queryOffers({
      query: query || undefined,
      category: category || null,
      limit,
      retailer,
      promotionOnly: true,
      sort: sort === 'price-asc' || sort === 'price-desc' ? sort : undefined,
      sortByDeals: sort === 'default' || !sort,
    })
  } catch (error) {
    console.error('DB Error in getDealsInDb:', error)
    return []
  }
}

export async function getDealsCoverageInDb(
  category?: SupportedCategory | null,
  retailer?: string | string[] | null,
  query?: string | null,
): Promise<DealCoverageByRetailer> {
  if (!hasDatabaseUrl()) {
    return buildEmptyDealCoverage()
  }

  try {
    const { whereStatement, values } = buildDealFilterClauses({
      query: query || null,
      category: category || null,
      retailer,
      promotionOnly: true,
    })

    const { rows } = await sql.query<{ store_id: Retailer; count: string | number }>(
      `
        SELECT p.store_id, COUNT(*) AS count
        FROM products p
        JOIN prices pr ON pr.product_id = p.id
        ${whereStatement}
        GROUP BY p.store_id
      `,
      values,
    )

    const coverage = buildEmptyDealCoverage()
    for (const row of rows) {
      coverage[row.store_id] = Number.parseInt(String(row.count), 10) || 0
    }

    return coverage
  } catch (error) {
    console.error('DB Error in getDealsCoverageInDb:', error)
    return buildEmptyDealCoverage()
  }
}

export async function getBalancedDealsInDb(
  category?: SupportedCategory | null,
  retailer?: string | string[] | null,
  perRetailerLimit = 20,
  query?: string | null,
) {
  if (!hasDatabaseUrl()) {
    return []
  }

  try {
    const { whereStatement, values } = buildDealFilterClauses({
      query: query || null,
      category: category || null,
      retailer,
      promotionOnly: true,
    })

    values.push(perRetailerLimit)
    const perRetailerLimitPlaceholder = `$${values.length}`

    const sqlQuery = `
      WITH ranked_deals AS (
        SELECT
          p.id,
          p.store_id,
          p.source_product_id,
          p.source_url,
          p.source_category_path,
          p.name,
          p.category,
          p.brand,
          p.image,
          p.description,
          p.availability,
          p.quantity,
          p.unit_price,
          p.last_scraped_at,
          pr.price,
          pr.original_price,
          pr.discount,
          pr.is_on_promotion,
          pr.updated_at,
          ROW_NUMBER() OVER (
            PARTITION BY p.store_id
            ORDER BY COALESCE(pr.discount, 0) DESC, pr.updated_at DESC, pr.price ASC, p.name ASC
          ) AS retailer_rank
        FROM products p
        JOIN prices pr ON pr.product_id = p.id
        ${whereStatement}
      )
      SELECT *
      FROM ranked_deals
      WHERE retailer_rank <= ${perRetailerLimitPlaceholder}
      ORDER BY store_id ASC, retailer_rank ASC
    `

    const { rows } = await sql.query<(OfferDbRow & { retailer_rank: number })>(sqlQuery, values)
    return rows.map(mapOfferRow)
  } catch (error) {
    console.error('DB Error in getBalancedDealsInDb:', error)
    return []
  }
}

export async function getProductSitemapEntries(limit = 5000) {
  if (!hasDatabaseUrl()) {
    return []
  }

  try {
    const { rows } = await sql.query<{ id: string; updated_at: Date | string | null }>(
      `
        SELECT id, created_at AS updated_at
        FROM products
        ORDER BY created_at DESC NULLS LAST, id ASC
        LIMIT $1
      `,
      [limit],
    )

    return rows.map((row) => ({
      id: row.id,
      lastModified:
        row.updated_at instanceof Date
          ? row.updated_at
          : row.updated_at
            ? new Date(row.updated_at)
            : null,
    }))
  } catch (error) {
    console.error('DB Error in getProductSitemapEntries:', error)
    return []
  }
}

export async function upsertOffersBatch(offers: ValidatedOffer[]) {
  if (offers.length === 0) return
  if (!hasDatabaseUrl()) return

  const now = new Date().toISOString()
  const client = createDbClient()

  try {
    await client.connect()
    await client.query('BEGIN')
    await ensureProductRetailerConstraint(client)
    await ensureProductCategoryConstraint(client)

    const normalizedOffers = await resolvePersistedOfferIds(client, offers)

    for (const chunk of chunkArray(normalizedOffers, 150)) {
      const values = chunk.flatMap((offer) => [
        offer.id,
        offer.retailer,
        offer.sourceProductId,
        offer.sourceUrl,
        offer.sourceCategoryPath || null,
        offer.name,
        offer.category,
        offer.brand || null,
        offer.image || null,
        offer.description || null,
        offer.availability || null,
        offer.quantity || null,
        offer.unitPrice || null,
        now,
      ])

      const placeholders = buildPlaceholders(chunk.length, PRODUCT_COLUMNS.length)

      await client.query(
        `
          INSERT INTO products (${PRODUCT_COLUMNS.join(', ')})
          VALUES ${placeholders}
          ON CONFLICT (id) DO UPDATE SET
            store_id = EXCLUDED.store_id,
            source_product_id = EXCLUDED.source_product_id,
            source_url = EXCLUDED.source_url,
            source_category_path = EXCLUDED.source_category_path,
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            brand = EXCLUDED.brand,
            image = EXCLUDED.image,
            description = EXCLUDED.description,
            availability = EXCLUDED.availability,
            quantity = EXCLUDED.quantity,
            unit_price = EXCLUDED.unit_price,
            last_scraped_at = EXCLUDED.last_scraped_at
        `,
        values,
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    console.error('DB Error in upsertOffersBatch:', error)
    throw error
  } finally {
    await client.end().catch(() => undefined)
  }
}

export async function upsertOfferPricesBatch(offers: ValidatedOffer[]) {
  if (offers.length === 0) return
  if (!hasDatabaseUrl()) return

  const now = new Date().toISOString()
  const client = createDbClient()

  try {
    await client.connect()
    await client.query('BEGIN')
    await ensureProductRetailerConstraint(client)

    const normalizedOffers = await resolvePersistedOfferIds(client, offers)

    for (const chunk of chunkArray(normalizedOffers, 200)) {
      const values = chunk.flatMap((offer) => [
        offer.id,
        offer.price,
        offer.originalPrice || null,
        offer.discount || null,
        offer.isOnPromotion ? true : false,
        now,
      ])

      const placeholders = buildPlaceholders(chunk.length, PRICE_COLUMNS.length)

      await client.query(
        `
          INSERT INTO prices (${PRICE_COLUMNS.join(', ')})
          VALUES ${placeholders}
          ON CONFLICT (product_id) DO UPDATE SET
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            discount = EXCLUDED.discount,
            is_on_promotion = EXCLUDED.is_on_promotion,
            updated_at = EXCLUDED.updated_at
        `,
        values,
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    console.error('DB Error in upsertOfferPricesBatch:', error)
    throw error
  } finally {
    await client.end().catch(() => undefined)
  }
}

export async function pruneStaleOffersByRetailer(retailer: Retailer, activeOfferIds: string[]) {
  if (activeOfferIds.length === 0) {
    throw new Error(`Cannot prune offers for retailer "${retailer}" with an empty active offer set`)
  }
  if (!hasDatabaseUrl()) return

  const client = createDbClient()

  try {
    await client.connect()
    await client.query('BEGIN')

    await client.query(
      `
        DELETE FROM products
        WHERE store_id = $1
          AND NOT (id = ANY($2::text[]))
      `,
      [retailer, activeOfferIds],
    )

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    console.error(`DB Error in pruneStaleOffersByRetailer (${retailer}):`, error)
    throw error
  } finally {
    await client.end().catch(() => undefined)
  }
}
