import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

const BASE = 'http://localhost:3001';
const pages = [
  { name: 'home', url: `${BASE}/` },
  { name: 'categorie', url: `${BASE}/categorie/hygiene` },
  { name: 'deals', url: `${BASE}/deals` },
];

const tag = process.argv[2] || 'baseline';
const outDir = `/tmp/snapshots-${tag}`;
fs.mkdirSync(outDir, { recursive: true });

// Try existing Chromium binaries
const candidates = [
  '/Users/estebandeloge/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/estebandeloge/Library/Caches/ms-playwright/chromium-1223/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
  '/Users/estebandeloge/Library/Caches/ms-playwright/chromium-1224/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
];

let executablePath = null;
for (const c of candidates) {
  try { if (fs.existsSync(c)) { executablePath = c; break; } } catch {}
}
if (!executablePath) {
  console.error('No Chromium binary found. Tried:');
  candidates.forEach(c => console.error(' -', c));
  process.exit(1);
}
console.log('Using Chromium:', executablePath);

const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

const metrics = {};

for (const p of pages) {
  console.log(`[${tag}] ${p.name}: ${p.url}`);
  const start = Date.now();
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - start;

    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || null;
      const resources = performance.getEntriesByType('resource');
      const jsBytes = resources.filter(r => r.initiatorType === 'script').reduce((s, r) => s + (r.transferSize || 0), 0);
      const cssBytes = resources.filter(r => r.name.match(/\.css(\?|$)/)).reduce((s, r) => s + (r.transferSize || 0), 0);
      const imgBytes = resources.filter(r => r.initiatorType === 'img').reduce((s, r) => s + (r.transferSize || 0), 0);
      const fontBytes = resources.filter(r => r.name.match(/\.woff2?$/)).reduce((s, r) => s + (r.transferSize || 0), 0);
      return {
        ttfb: nav?.responseStart - nav?.requestStart || null,
        domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime || null,
        load: nav?.loadEventEnd - nav?.startTime || null,
        fcp: fcp ? Math.round(fcp) : null,
        resourceCount: resources.length,
        jsBytes,
        cssBytes,
        imgBytes,
        fontBytes,
      };
    });

    await page.screenshot({ path: `${outDir}/${p.name}.png`, fullPage: false });
    metrics[p.name] = { ...perf, gotoTime: loadTime };
    console.log(`  TTFB=${perf.ttfb?.toFixed(0)}ms FCP=${perf.fcp}ms load=${perf.load?.toFixed(0)}ms JS=${(perf.jsBytes/1024).toFixed(1)}KB img=${(perf.imgBytes/1024).toFixed(1)}KB font=${(perf.fontBytes/1024).toFixed(1)}KB`);
  } catch (e) {
    console.log(`  FAILED: ${e.message}`);
    metrics[p.name] = { error: e.message };
  }
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
console.log(`\nWrote ${outDir}/metrics.json`);

await browser.close();
