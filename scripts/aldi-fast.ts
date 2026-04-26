#!/usr/bin/env npx tsx
/**
 * Aldi France Scraper - Fast version
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ALDI_BASE_URL = 'https://www.aldi.fr';
const OUTPUT_DIR = path.join(process.cwd(), 'output');

interface Product {
  name: string;
  price: number;
  url: string;
  category: string;
  subcategory: string;
  brand: string;
  image: string;
  original_price: number | null;
  quantity: string;
  promotion: string;
  discount_percent: number | null;
}

const CATEGORIES = [
  ['alimentation', 'viande-poisson', 'Viandes et poissons'],
  ['alimentation', 'produits-laitiers', 'Produits laitiers et œufs'],
  ['alimentation', 'charcuterie', 'Charcuterie et traiteur'],
  ['alimentation', 'epicerie-salee', 'Épicerie salée'],
  ['alimentation', 'epicerie-sucree', 'Épicerie sucrée'],
  ['alimentation', 'pain-viennoiserie', 'Pains et viennoiseries'],
  ['alimentation', 'surgeles', 'Produits surgelés'],
  ['alimentation', 'boissons', 'Boissons sans alcool'],
  ['hygiene', 'hygiene-beaute-bebe', 'Hygiène, beauté et produits bébé'],
  ['menage', 'entretien', 'Entretien et nettoyage'],
  ['alimentation', 'biere-vin-alcool', 'Bières, vins et spiritueux'],
  ['alimentation', 'animalerie', 'Animalerie'],
];

function extractPrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.trim().replace(' ', '').replace(',', '.');
  const match = cleaned.match(/(\d+[.,]?\d*)/);
  if (match) {
    try { return parseFloat(match.group(1).replace(',', '.')); } catch { return null; }
  }
  return null;
}

async function main() {
  console.log('Aldi Scraper - Fast');

  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] });
  const context = await browser.newContext({
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
    locale: 'fr-FR', viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const allProducts: Product[] = [];

  for (const [category, catPath, displayName] of CATEGORIES) {
    console.log(`\n[${displayName}]`);
    
    const subcategories = await page.evaluate(
      ({ baseUrl, catPath }: { baseUrl: string; catPath: string }) => {
        const anchors = Array.from(document.querySelectorAll('a[title]'));
        const subcats: [string, string][] = [];
        const seen = new Set<string>();
        anchors.forEach((link) => {
          const href = link.getAttribute('href');
          const title = link.getAttribute('title');
          if (href && title && href.includes(`/produits/${catPath}/`) && href.endsWith('.html')) {
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            if (!seen.has(fullUrl)) { seen.add(fullUrl); subcats.push([title, fullUrl]); }
          }
        });
        return subcats;
      },
      { baseUrl: ALDI_BASE_URL, catPath }
    );

    for (const [subName, subUrl] of subcategories) {
      await page.goto(subUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      
      // Click "Voir plus" multiple times
      for (let i = 0; i < 15; i++) {
        try {
          const btn = page.locator('button:has-text("Voir plus")');
          if (!(await btn.isVisible().catch(() => false))) break;
          await btn.click();
          await page.waitForTimeout(1500);
        } catch { break; }
      }

      const products = await page.evaluate(() => {
        const tiles = Array.from(document.querySelectorAll('.product-tile'));
        return tiles.map((tile) => ({
          brand: tile.querySelector('.product-tile__content__upper__brand-name')?.textContent?.trim() || '',
          name: tile.querySelector('.product-tile__content__upper__product-name')?.textContent?.trim() || '',
          price: tile.querySelector('.tag__label--price')?.textContent?.trim() || '',
          quantity: tile.querySelector('.tag__marker--salesunit')?.textContent?.trim() || '',
          href: (tile.querySelector('.product-tile__action') as HTMLAnchorElement)?.href || '',
          promo: tile.querySelector('.product-tile__flags')?.textContent?.trim() || '',
        })).filter((t) => t.name && t.price && t.href);
      });

      for (const item of products) {
        const price = extractPrice(item.price);
        if (!price) continue;
        allProducts.push({
          name: item.name, price, url: item.href.startsWith('http') ? item.href : ALDI_BASE_URL + item.href,
          category, subcategory: subName, brand: item.brand, image: '', quantity: item.quantity, promotion: item.promo,
          original_price: null, discount_percent: null
        });
      }
      console.log(`  ${subName}: ${products.length}`);
    }
  }

  // Deduplicate
  const seenUrls = new Set<string>();
  const uniqueProducts = allProducts.filter(p => {
    const key = p.url.toLowerCase();
    if (seenUrls.has(key)) return false;
    seenUrls.add(key); return true;
  });

  console.log(`\nTotal: ${uniqueProducts.length} produits`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `aldi_products_${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(uniqueProducts, null, 2), 'utf-8');
  console.log(`Saved: ${filename}`);

  await browser.close();
}

main();