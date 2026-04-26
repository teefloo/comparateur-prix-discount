import dotenv from 'dotenv'

import { sql } from '@vercel/postgres'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: '.env.local' })
ensureDatabaseUrlEnv()

async function alignOfferColumns() {
  console.log('Aligning offer metadata columns with the store-specific schema...')

  try {
    await sql.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity TEXT`)
    await sql.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price TEXT`)
    await sql.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`)
    await sql.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS availability TEXT`)
    await sql.query(`ALTER TABLE prices ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2)`)
    await sql.query(`ALTER TABLE prices ADD COLUMN IF NOT EXISTS discount INTEGER`)
    await sql.query(`ALTER TABLE prices ADD COLUMN IF NOT EXISTS is_on_promotion BOOLEAN NOT NULL DEFAULT FALSE`)
    console.log('Columns aligned successfully')
  } catch (error) {
    console.error('Schema alignment failed:', error)
    process.exitCode = 1
  }
}

void alignOfferColumns()
