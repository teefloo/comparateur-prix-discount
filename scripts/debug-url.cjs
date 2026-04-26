const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.aldi.fr/produits/produits-laitiers/desserts.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  const url = page.url();
  console.log('URL:', url);
  
  // Check for subcategory links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .filter(a => a.href.includes('/produits/'))
      .slice(0, 10)
      .map(a => ({ title: a.getAttribute('title'), href: a.href }));
  });
  console.log('Links:', JSON.stringify(links, null, 2));
  
  await browser.close();
})();