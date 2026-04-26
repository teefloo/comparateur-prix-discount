#!/usr/bin/env npx tsx
/**
 * Aldi Scraper - Working version with explicit waits
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ALDI_BASE_URL = 'https://www.aldi.fr';
const OUTPUT_DIR = path.join(process.cwd(), 'output');

interface Product {
  name: string; price: number; url: string;
  category: string; subcategory: string;
  brand: string; image: string;
  original_price: number | null;
  quantity: string; promotion: string;
  discount_percent: number | null;
}

const CATEGORIES = [
  ['alimentation', 'viande-poisson'],
  ['alimentation', 'produits-laitiers'],
  ['alimentation', 'charcuterie'],
  ['alimentation', 'epicerie-salee'],
  ['alimentation', 'epicerie-sucree'],
  ['alimentation', 'pain-viennoiserie'],
  ['alimentation', 'surgeles'],
  ['alimentation', 'boissons'],
  ['hygiene', 'hygiene-beaute-bebe'],
  ['menage', 'entretien'],
  ['alimentation', 'biere-vin-alcool'],
  ['alimentation', 'animalerie'],
];

function extractPrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.trim().replace(' ', '').replace(',', '.');
  const match = cleaned.match(/(\d+[.,]?\d*)/);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
}

async function main() {
  console.log('Aldi Scraper');
  
  const browser = await chromium.launch({ 
    headless: true, 
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] 
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  
  const allProducts: Product[] = [];

  for (const [category, catPath] of CATEGORIES) {
    console.log(`\n[${catPath}]`);
    
    // Get subcategories
    await page.goto(`${ALDI_BASE_URL}/produits/${catPath}.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const subcats = await page.evaluate((catPath) => {
      const anchors = Array.from(document.querySelectorAll('a[title]'));
      return anchors
        .filter(a => {
          const href = a.getAttribute('href');
          return href && href.includes(`/produits/${catPath}/`) && href.endsWith('.html');
        })
        .map(a => [a.getAttribute('title'), a.getAttribute('href')])
        .filter((s): s is [string, string] => s[0] !== null && s[1] !== null);
    }, catPath);
    
    console.log(`  ${subcats.length} subcats`);
    
    for (const [subName, subUrl] of subcats) {
      await page.goto(subUrl.startsWith('http') ? subUrl : ALDI_BASE_URL + subUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Click voir plus up to 50 times to get ALL products
      for (let i = 0; i < 50; i++) {
        const btn = page.locator('button:has-text("Voir plus")');
        if (!(await btn.isVisible().catch(() => false))) break;
        await btn.click();
        await page.waitForTimeout(2000);
      }
      
      const products = await page.evaluate(() => {
        const tiles = Array.from(document.querySelectorAll('.product-tile'));
        return tiles.map(tile => {
          const nameEl = tile.querySelector('.product-tile__content__upper__product-name');
          const name = nameEl?.textContent?.trim() || '';
          const priceEl = tile.querySelector('.tag__label--price');
          const price = priceEl?.textContent?.trim() || priceEl?.textContent?.trim() || '';
          const hrefEl = tile.querySelector('.product-tile__action') as HTMLAnchorElement;
          const href = hrefEl?.href || '';
          return {
            brand: tile.querySelector('.product-tile__content__upper__brand-name')?.textContent?.trim() || '',
            name,
            price,
            quantity: tile.querySelector('.tag__marker--salesunit')?.textContent?.trim() || '',
            href,
            promo: tile.querySelector('.product-tile__flags')?.textContent?.trim() || '',
          };
        }).filter(t => t.name && t.href);
      });
      
      for (const p of products) {
        const price = extractPrice(p.price);
        if (!price) continue;
        allProducts.push({
          name: p.name, price,
          url: p.href.startsWith('http') ? p.href : ALDI_BASE_URL + p.href,
          category, subcategory: subName || '',
          brand: p.brand, image: '', quantity: p.quantity, promotion: p.promo,
          original_price: null, discount_percent: null
        });
      }
      console.log(`    ${subName}: ${products.length}`);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = allProducts.filter(p => {
    const key = p.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  console.log(`\nTotal: ${unique.length} products`);
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, `aldi_products_${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(unique, null, 2), 'utf-8');
  console.log(`Saved: ${path.basename(file)}`);

  await browser.close();
}

main().catch(console.error);