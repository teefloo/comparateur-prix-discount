const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const tests = [
    'https://www.aldi.fr/produits/entretien/produits-nettoyants.html',
    'https://www.aldi.fr/produits/epicerie-salee/plat-cuisine.html'
  ];
  
  for (const url of tests) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    for (let i = 0; i < 50; i++) {
      const btn = page.locator('button:has-text("Voir plus")');
      if (!(await btn.isVisible().catch(() => false))) break;
      await btn.click();
      await page.waitForTimeout(2000);
    }
    
    const tiles = await page.locator('.product-tile').count();
    console.log(url.split('/').pop() + ': ' + tiles + ' tiles');
  }
  
  await browser.close();
})();