import { chromium } from 'playwright';

async function inspectCentrakor() {
  console.log('Starting Centrakor inspection...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  
  // Try a specific subcategory that should have products
  const urls = [
    'https://www.centrakor.com/bain-et-beaute.html',
    'https://www.centrakor.com/bain-et-beaute/huilette.html',
    'https://www.centrakor.com/bain-et-beaute/accessoire-douche-et-baignoire.html',
    'https://www.centrakor.com/rangement.html',
    'https://www.centrakor.com/deco.html'
  ];
  
  for (const url of urls) {
    console.log(`\n=== Checking: ${url} ===`);
    
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(5000);
      
      // Look for product-related content
      const productCount = await page.evaluate(() => {
        // Look for any price patterns like "X,XX€" or "X.XX€"
        const body = document.body.innerHTML;
        const priceMatches = body.match(/\d+[,.]\d{2}\s*(?:€|EUR)/g);
        return priceMatches ? priceMatches.length : 0;
      });
      
      console.log(`Price patterns found: ${productCount}`);
      
      // Check for product-specific elements
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(`Text sample: ${bodyText.replace(/\n/g, ' ').substring(0, 200)}`);
      
    } catch (e) {
      console.log(`Error loading: ${e.message}`);
    }
  }
  
  await browser.close();
  console.log('\nDone!');
}

inspectCentrakor().catch(console.error);
