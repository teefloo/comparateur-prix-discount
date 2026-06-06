import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const sources = [
  { svg: 'public/brand/concept-2-etiquette/icon.svg', png: 'public/logo.png', size: 1024 },
  { svg: 'public/brand/favicon.svg', png: 'public/favicon.png', size: 512 },
]

for (const { svg, png, size } of sources) {
  const svgPath = resolve(root, svg)
  const pngPath = resolve(root, png)
  const svgBuffer = await readFile(svgPath)
  await sharp(svgBuffer, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 252, g: 253, b: 254, alpha: 1 } })
    .png()
    .toFile(pngPath)
  console.log(`✓ ${png} ← ${svg} (${size}×${size})`)
}
