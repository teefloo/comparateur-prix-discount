import { spawn } from 'node:child_process'

const shouldRunOnVercel = process.env.VERCEL === '1'
const skipScrape = process.env.VERCEL_SKIP_SCRAPE === '1'
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'

if (!shouldRunOnVercel) {
  console.log('[postbuild] VERCEL is not set, skipping deployment scrape.')
  process.exit(0)
}

if (skipScrape) {
  console.log('[postbuild] VERCEL_SKIP_SCRAPE=1, skipping deployment scrape.')
  process.exit(0)
}

console.log('[postbuild] Running weekly scrape after Vercel build...')

const child = spawn(command, ['tsx', 'scripts/weekly-scrape.ts'], {
  stdio: 'inherit',
  env: process.env,
})

child.on('error', (error) => {
  console.error('[postbuild] Failed to start scrape:', error)
  process.exit(1)
})

child.on('close', (code) => {
  if (code === 0) {
    console.log('[postbuild] Deployment scrape completed successfully.')
    process.exit(0)
  }

  console.error(`[postbuild] Deployment scrape failed with exit code ${code ?? 1}, but the deployment will continue.`)
  process.exit(0)
})
