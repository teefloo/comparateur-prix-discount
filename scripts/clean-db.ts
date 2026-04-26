import { sql } from '@vercel/postgres'
import dotenv from 'dotenv'
import path from 'path'
import { ensureDatabaseUrlEnv } from '../src/lib/ensure-db-env'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
ensureDatabaseUrlEnv()

async function cleanDatabase() {
  try {
    console.log('Cleaning database...')

    await sql.query('TRUNCATE TABLE prices, products RESTART IDENTITY CASCADE')

    console.log('Database cleaned')
  } catch (error) {
    console.error('Error while cleaning database:', error)
    process.exitCode = 1
  }
}

void cleanDatabase()
