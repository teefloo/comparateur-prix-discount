import { sql } from '@vercel/postgres'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

ensureDatabaseUrlEnv()

async function checkVercelDB() {
  const { rows } = await sql`
    SELECT COUNT(*) as cnt FROM products
  `
  console.log('Products in Vercel DB:', rows[0].cnt)
  
  const { rows: sample } = await sql`
    SELECT name, category FROM products 
    WHERE name ILIKE '%chocolat%' 
    LIMIT 5
  `
  console.log('\nSample products with chocolat:')
  sample.forEach(p => console.log(`  - ${p.name.substring(0,60)} (${p.category})`))
}

checkVercelDB().catch(console.error)
