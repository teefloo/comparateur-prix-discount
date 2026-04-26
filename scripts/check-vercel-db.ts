import dotenv from 'dotenv'
import { sql } from '@vercel/postgres'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: '.env.local' })
ensureDatabaseUrlEnv()

async function check() {
  const { rows } = await sql`SELECT COUNT(*) as cnt FROM products`
  console.log('Products:', rows[0].cnt)
}

check().catch(console.error)
