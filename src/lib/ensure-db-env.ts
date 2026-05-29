export function ensureDatabaseUrlEnv() {
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL
  }

  return process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
}

export function hasDatabaseUrl() {
  return Boolean(ensureDatabaseUrlEnv())
}
