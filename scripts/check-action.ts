import dotenv from 'dotenv'
import pg from 'pg'

const { Client } = pg
dotenv.config({ path: '.env.local' })

async function checkActionQuantities() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL })
  await client.connect()

  const { rows } = await client.query(`
    SELECT
      p.id,
      p.name,
      p.store_id,
      pr.price::text AS price_str,
      p.quantity,
      p.unit_price,
      p.source_url
    FROM products p
    JOIN prices pr ON p.id = pr.product_id
    WHERE p.name ILIKE '%coca%' AND p.store_id = 'action'
    LIMIT 10
  `)

  console.log('Action offers in DB:')
  rows.forEach((row) => {
    console.log(`  Name: ${row.name}`)
    console.log(`  Price: ${row.price_str}`)
    console.log(`  Quantity: ${row.quantity}`)
    console.log(`  Unit Price: ${row.unit_price}`)
    console.log(`  URL: ${row.source_url}`)
    console.log('---')
  })

  await client.end()
}

checkActionQuantities().catch(console.error)
