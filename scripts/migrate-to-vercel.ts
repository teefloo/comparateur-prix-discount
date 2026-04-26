import dotenv from 'dotenv'

import { sql as sqlVercel } from '@vercel/postgres'
import pg from 'pg'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

const { Client } = pg

dotenv.config({ path: '.env.local' })
ensureDatabaseUrlEnv()

const localClient = new Client({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
})

async function migrate() {
  console.log('Migrating store-specific offers to Vercel DB...\n')

  await localClient.connect()

  const { rows } = await localClient.query(`
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
    JOIN prices pr ON p.id = pr.product_id
  `)

  console.log(`Found ${rows.length} store-specific offers in local DB`)

  let inserted = 0

  for (const row of rows) {
    try {
      await sqlVercel`
        INSERT INTO products (
          id,
          store_id,
          source_product_id,
          source_url,
          source_category_path,
          name,
          category,
          brand,
          image,
          description,
          availability,
          quantity,
          unit_price,
          last_scraped_at
        )
        VALUES (
          ${row.id},
          ${row.store_id},
          ${row.source_product_id},
          ${row.source_url},
          ${row.source_category_path},
          ${row.name},
          ${row.category},
          ${row.brand},
          ${row.image},
          ${row.description},
          ${row.availability},
          ${row.quantity},
          ${row.unit_price},
          ${row.last_scraped_at}
        )
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
      `

      await sqlVercel`
        INSERT INTO prices (
          product_id,
          price,
          original_price,
          discount,
          is_on_promotion,
          updated_at
        )
        VALUES (
          ${row.id},
          ${row.price},
          ${row.original_price},
          ${row.discount},
          ${row.is_on_promotion},
          ${row.updated_at}
        )
        ON CONFLICT (product_id) DO UPDATE SET
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          discount = EXCLUDED.discount,
          is_on_promotion = EXCLUDED.is_on_promotion,
          updated_at = EXCLUDED.updated_at
      `

      inserted += 1
      if (inserted % 100 === 0) {
        console.log(`  Inserted ${inserted} offers...`)
      }
    } catch (error) {
      console.error(`Failed to migrate offer ${row.id}:`, error)
    }
  }

  console.log(`\nMigration complete! ${inserted} offers migrated to Vercel DB`)

  await localClient.end()
}

migrate().catch(console.error)
