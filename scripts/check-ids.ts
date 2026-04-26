import dotenv from 'dotenv'
import { sql } from '@vercel/postgres'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: '.env.local' })
ensureDatabaseUrlEnv()

async function checkIds() {
  // Check what IDs look like
  const { rows } = await sql`
    SELECT id, name FROM products 
    WHERE name ILIKE '%chocolat%' 
    LIMIT 5
  `
  console.log('Product IDs in DB:')
  rows.forEach(r => console.log(`  ID: "${r.id}"`))
  console.log('\n  Name:', rows[0]?.name)
}

checkIds().catch(console.error)
