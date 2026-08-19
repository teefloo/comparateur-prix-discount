import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'

// Keep compatibility with the repository validation command `npm run test -- --run`.
// Node's test runner does not use Vitest's `--run` flag, so omit that marker and
// run the repository's tests through the already-installed tsx loader.
const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== '--run')
const testFiles = readdirSync('tests', { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
  .map((entry) => `tests/${entry.name}`)

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles, ...forwardedArgs],
  { stdio: 'inherit' },
)

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
