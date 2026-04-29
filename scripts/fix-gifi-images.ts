import dotenv from 'dotenv'
import path from 'path'

import { sql } from '@vercel/postgres'

import { normalizeGifiImageUrl } from '../src/lib/scrapers/gifi-scraper'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

type GifiImageRow = {
  id: string
  image: string | null
}

const BATCH_SIZE = 500

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }

  return chunks
}

async function fixGifiImages() {
  console.log('Starting GiFi image normalization...')
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  const { rows } = await sql.query<GifiImageRow>(
    `
      SELECT id, image
      FROM products
      WHERE store_id = 'gifi'
        AND image IS NOT NULL
    `,
  )

  const updates = rows
    .map((row) => {
      const normalized = normalizeGifiImageUrl(row.image)
      if (!normalized || normalized === row.image) {
        return null
      }

      return {
        id: row.id,
        image: normalized,
      }
    })
    .filter((entry): entry is { id: string; image: string } => entry !== null)

  console.log(`Found ${rows.length} GiFi images, ${updates.length} need normalization`)

  for (const chunk of chunkArray(updates, BATCH_SIZE)) {
    if (chunk.length === 0) continue

    const ids = chunk.map((entry) => entry.id)
    const images = chunk.map((entry) => entry.image)

    await sql.query(
      `
        UPDATE products AS p
        SET image = data.image
        FROM unnest($1::text[], $2::text[]) AS data(id, image)
        WHERE p.id = data.id
      `,
      [ids, images],
    )
  }

  console.log(`Normalized ${updates.length} GiFi image URLs`)
}

fixGifiImages().catch((error) => {
  console.error('GiFi image normalization failed:', error)
  process.exitCode = 1
})
