import dotenv from 'dotenv'

import { sql } from '@vercel/postgres'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: '.env.local' })
ensureDatabaseUrlEnv()

async function checkPrices() {
  const { rows } = await sql.query(`
    SELECT
      p.id,
      p.store_id,
      p.name,
      pr.price,
      pr.original_price,
      p.quantity,
      p.unit_price
    FROM products p
    JOIN prices pr ON p.id = pr.product_id
    WHERE p.name ILIKE '%chocolat%'
    ORDER BY pr.price ASC
    LIMIT 10
  `)

  console.log('Price table data:')
  console.log(JSON.stringify(rows, null, 2))
}

checkPrices().catch(console.error)
