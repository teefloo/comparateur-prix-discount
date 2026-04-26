import dotenv from 'dotenv'
import path from 'path'

import { sql } from '@vercel/postgres'

import { RETAILERS, SUPPORTED_CATEGORIES } from '../src/lib/catalog'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
ensureDatabaseUrlEnv()

const retailerCheck = RETAILERS.map((retailer) => `'${retailer}'`).join(', ')
const categoryCheck = SUPPORTED_CATEGORIES.map((category) => `'${category}'`).join(', ')

async function initDb() {
  console.log('Rebuilding database schema for store-specific offers...')
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  try {
    await sql.query(`DROP TABLE IF EXISTS prices`)
    await sql.query(`DROP TABLE IF EXISTS products`)

    await sql.query(`
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL CHECK (store_id IN (${retailerCheck})),
        source_product_id TEXT NOT NULL,
        source_url TEXT NOT NULL,
        source_category_path TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN (${categoryCheck})),
        brand TEXT,
        image TEXT,
        description TEXT,
        availability TEXT,
        quantity TEXT,
        unit_price TEXT,
        last_scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_store_source UNIQUE (store_id, source_product_id)
      )
    `)

    await sql.query(`
      CREATE TABLE prices (
        product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        discount INTEGER,
        is_on_promotion BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await sql.query(`CREATE INDEX products_name_idx ON products(name)`)
    await sql.query(`CREATE INDEX products_category_idx ON products(category)`)
    await sql.query(`CREATE INDEX products_store_idx ON products(store_id)`)
    await sql.query(`CREATE INDEX products_source_url_idx ON products(source_url)`)
    await sql.query(`CREATE INDEX prices_price_idx ON prices(price)`)

    console.log('Database schema created successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exitCode = 1
  }
}

void initDb()
