const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to entretien category
  await page.goto('https://www.aldi.fr/produits/entretien.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Get all subcategory links with title
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[title]'))
      .filter(a => a.href.includes('/produits/entretien/'))
      .map(a => ({ title: a.getAttribute('title'), href: a.href }));
  });
  
  console.log('Entretien subcategories:');
  links.forEach(l => console.log('  ' + l.title + ': ' + l.href));
  
  await browser.close();
})();