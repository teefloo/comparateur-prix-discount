const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.aldi.fr/produits/produits-laitiers/desserts.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  const title = await page.title();
  console.log('Title:', title);
  
  const tiles = await page.locator('.product-tile').count();
  console.log('Tiles:', tiles);
  
  const hasProducts = await page.evaluate(() => {
    const tiles = document.querySelectorAll('.product-tile');
    return Array.from(tiles).slice(0, 3).map(t => ({
      name: t.querySelector('.product-tile__content__upper__product-name')?.textContent?.trim(),
      price: t.querySelector('.tag__label--price')?.textContent?.trim(),
      href: t.querySelector('.product-tile__action')?.href
    }));
  });
  console.log('First 3:', JSON.stringify(hasProducts, null, 2));
  
  await browser.close();
})();