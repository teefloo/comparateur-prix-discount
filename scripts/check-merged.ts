import { sql } from '@vercel/postgres'
import dotenv from 'dotenv'
import path from 'path'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
ensureDatabaseUrlEnv()

async function check() {
  const { rows } = await sql.query(`
    SELECT
      p.name,
      COUNT(DISTINCT p.store_id) AS store_count,
      STRING_AGG(DISTINCT p.store_id, ', ') AS stores
    FROM products p
    JOIN prices pr ON p.id = pr.product_id
    GROUP BY p.name
    HAVING COUNT(DISTINCT p.store_id) > 1
    ORDER BY store_count DESC, p.name ASC
    LIMIT 20
  `)

  console.table(rows)
}

check().catch(console.error)
