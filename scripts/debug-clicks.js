const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.aldi.fr/produits/epicerie-salee/fruit-legume.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  console.log('=== Fruits et legumes en conserve ===');
  
  for (let i = 0; i < 10; i++) {
    const tiles = await page.locator('.product-tile').count();
    const btn = page.locator('button:has-text("Voir plus")');
    const isVisible = await btn.isVisible().catch(() => false);
    console.log('Click ' + (i+1) + ' - Tiles: ' + tiles + ' - Button visible: ' + isVisible);
    if (!isVisible) break;
    await btn.click();
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
})();