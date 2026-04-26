const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://www.aldi.fr/produits/entretien/nettoyant-desordorisant.html';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  console.log('Title:', await page.title());
  
  for (let i = 0; i < 50; i++) {
    const btn = page.locator('button:has-text("Voir plus")');
    if (!(await btn.isVisible().catch(() => false))) break;
    await btn.click();
    await page.waitForTimeout(2000);
  }
  
  const tiles = await page.locator('.product-tile').count();
  console.log('Tiles: ' + tiles);
  
  await browser.close();
})();