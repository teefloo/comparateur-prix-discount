import { sql } from '@vercel/postgres'
import dotenv from 'dotenv'
import path from 'path'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
ensureDatabaseUrlEnv()

async function check() {
  const { rows } = await sql.query(`
    SELECT p.name, p.store_id, pr.price
    FROM products p
    JOIN prices pr ON p.id = pr.product_id
    WHERE p.name ILIKE '%ariel%'
    ORDER BY pr.price ASC
  `)

  console.table(rows)
}

check().catch(console.error)
