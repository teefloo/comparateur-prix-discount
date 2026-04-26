#!/usr/bin/env npx tsx
/**
 * Aldi France Scraper - ALL Products with correct selectors
 * Based on actual HTML structure from browser-use analysis
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
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

const MAX_CLICKS = 50;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.trim().replace(' ', '').replace(',', '.');
  const match = cleaned.match(/(\d+[.,]?\d*)/);
  if (match) {
    try {
      return parseFloat(match.group(1).replace(',', '.'));
    } catch {
      return null;
    }
  }
  return null;
}

async function acceptCookies(page: Page) {
  try {
    const btn = page.locator('button:has-text("Accepter"), button[data-testid="uc-accept-all-button"]').first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await sleep(500);
    }
  } catch {
    // Ignore
  }
}

async function getSubcategories(page: Page, categoryPath: string): Promise<[string, string][]> {
  const url = `${ALDI_BASE_URL}/produits/${categoryPath}.html`;
  const subcategories: [string, string][] = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(3000);
    await acceptCookies(page);

    // Get subcategory links from the page
    const links = await page.evaluate(
      ({ baseUrl, catPath }: { baseUrl: string; catPath: string }) => {
        const anchors = Array.from(document.querySelectorAll('a[title]'));
        const subcats: [string, string][] = [];
        const seen = new Set<string>();

        anchors.forEach((link) => {
          const href = link.getAttribute('href');
          const title = link.getAttribute('title');
          if (!href || !title) return;
          
          if (href.includes(`/produits/${catPath}/`) && href.endsWith('.html')) {
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            if (!seen.has(fullUrl)) {
              seen.add(fullUrl);
              subcats.push([title, fullUrl]);
            }
          }
        });

        return subcats;
      },
      { baseUrl: ALDI_BASE_URL, catPath: categoryPath }
    );

    console.log(`    Found ${links?.length || 0} subcategories`);
    if (links && links.length > 0) {
      subcategories.push(...links);
    } else {
      subcategories.push([categoryPath, url]);
    }
  } catch (e) {
    console.log(`    Error: ${e}`);
    subcategories.push([categoryPath, url]);
  }

  return subcategories;
}

async function scrapeWithPagination(
  page: Page,
  url: string,
  category: string,
  subcategory: string
): Promise<Product[]> {
  const products: Product[] = [];
  const seenUrls = new Set<string>();
  let lastCount = 0;
  let consecutiveNoNew = 0;
  let totalClicks = 0;

  console.log(`    Scraping: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2000);
    await acceptCookies(page);

    // Debug: check what's on page - only first 200 chars
    const pageTitle = await page.title();
    console.log(`    Page title: ${pageTitle}`);

    while (totalClicks < MAX_CLICKS) {
      // Extract products using correct selectors from HTML analysis
      const data = await page.evaluate(() => {
        const tiles = Array.from(document.querySelectorAll('.product-tile'));
        console.log('Found tiles:', tiles.length);
        return tiles
          .map((tile) => {
            const brand =
              tile.querySelector('.product-tile__content__upper__brand-name')?.textContent?.trim() || '';
            const name =
              tile.querySelector('.product-tile__content__upper__product-name')?.textContent?.trim() || '';
            const price =
              tile.querySelector('.tag__label--price')?.textContent?.trim() || '';
            const quantity =
              tile.querySelector('.tag__marker--salesunit')?.textContent?.trim() || '';
            const a = tile.querySelector('.product-tile__action') as HTMLAnchorElement;
            const href = a?.href || '';
            const promo =
              tile.querySelector('.product-tile__flags')?.textContent?.trim() || '';

            if (name && price) {
              console.log(`Extracted: ${name} - ${price}`);
            }
            return { brand, name, price, quantity, href, promo };
          })
          .filter((t) => t.name && t.price && t.href);
      });

      console.log(`Extracted ${data?.length || 0} products`);
      if (!data || data.length === 0) break;

      let newCount = 0;
      for (const item of data) {
        const urlKey = item.href.toLowerCase();
        if (seenUrls.has(urlKey)) continue;
        seenUrls.add(urlKey);

        const price = extractPrice(item.price);
        if (!price || price <= 0) continue;

        const fullUrl = item.href.startsWith('http')
          ? item.href
          : ALDI_BASE_URL + item.href;

        products.push({
          name: item.name,
          price,
          url: fullUrl,
          category,
          subcategory,
          brand: item.brand,
          image: '',
          quantity: item.quantity,
          promotion: item.promo,
          original_price: null,
          discount_percent: null,
        });
        newCount++;
      }

      const currentCount = seenUrls.size;

      if (currentCount > lastCount) {
        lastCount = currentCount;
        consecutiveNoNew = 0;
      } else {
        consecutiveNoNew++;
      }

      if (consecutiveNoNew >= 3) {
        console.log(`    -> Fin après ${totalClicks} clicks (${currentCount} total)`);
        break;
      }

      try {
        // Click "Voir plus" button
        const btn = page.locator(
          'button:has-text("Voir plus"), button[data-testid="product-tile-grid-load-more-button"]'
        );
        if (!(await btn.isVisible().catch(() => false))) {
          console.log(`    -> Plus de bouton après ${totalClicks} clicks`);
          break;
        }

        totalClicks++;
        await btn.click();
        await sleep(2500);
      } catch {
        console.log(`    -> Erreur bouton après ${totalClicks} clicks`);
        break;
      }
    }
  } catch (e) {
    console.error('Erreur scrape:', e);
  }

  return products;
}

async function main() {
  console.log('='.repeat(50));
  console.log('Aldi Scraper - Correct Selectors');
  console.log('='.repeat(50));

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    user_agent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const allProducts: Product[] = [];

  try {
    for (const [catIdx, [category, catPath, displayName]] of CATEGORIES.entries()) {
      console.log(`\n[${catIdx + 1}/${CATEGORIES.length}] ${displayName}`);

      const subcategories = await getSubcategories(page, catPath);
      console.log(`  ${subcategories.length} sous-catégories`);

      for (const [subIdx, [subName, subUrl]] of subcategories.entries()) {
        const prods = await scrapeWithPagination(page, subUrl, category, subName);
        allProducts.push(...prods);

        if (prods.length > 0) {
          console.log(`  [${subIdx + 1}/${subcategories.length}] ${subName}: ${prods.length} produits`);
        }

        await sleep(300);
      }
    }

    // Deduplicate
    const seenUrls = new Set<string>();
    const uniqueProducts: Product[] = [];
    for (const p of allProducts) {
      const key = p.url.toLowerCase();
      if (!seenUrls.has(key)) {
        seenUrls.add(key);
        uniqueProducts.push(p);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`TOTAL: ${uniqueProducts.length} produits uniques`);
    console.log(`${'='.repeat(50)}`);

    const byCat: Record<string, number> = {};
    for (const p of uniqueProducts) {
      byCat[p.category] = (byCat[p.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(byCat)) {
      console.log(`  ${cat}: ${count}`);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const filename = `aldi_products_${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(uniqueProducts, null, 2), 'utf-8');
    console.log(`\nSaved: ${filepath}`);
  } catch (e) {
    console.error('Erreur:', e);
  } finally {
    await browser.close();
  }
}

main();