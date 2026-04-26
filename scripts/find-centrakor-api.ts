import { chromium } from 'playwright';

async function findCentrakorAPI() {
  console.log('Starting Centrakor API discovery...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  
  // Capture all network requests
  const apiRequests: string[] = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('api') || url.includes('json') || url.includes('product') || url.includes('catalog')) {
      apiRequests.push(`REQUEST: ${request.method()} ${url}`);
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('api') || url.includes('json') || url.includes('product') || url.includes('catalog')) {
      apiRequests.push(`RESPONSE: ${response.status()} ${url}`);
    }
  });
  
  console.log('Opening Centrakor bain-et-beaute...');
  
  try {
    await page.goto('https://www.centrakor.com/bain-et-beaute.html', { 
      waitUntil: 'load', 
      timeout: 20000 
    });
  } catch (e) {
    console.log('Load timeout, continuing...');
  }
  
  // Wait for any async requests
  await page.waitForTimeout(5000);
  
  console.log('\nAPI-related requests found:');
  for (const req of apiRequests.slice(0, 30)) {
    console.log(req);
  }
  
  // Also check for any window variables that might contain product data
  const windowData = await page.evaluate(() => {
    const results: Record<string, any> = {};
    for (const key of Object.keys(window)) {
      if (key.startsWith('__') || key.includes('Product') || key.includes('Catalog') || key.includes('Data')) {
        try {
          results[key] = typeof (window as any)[key];
        } catch {
          results[key] = 'inaccessible';
        }
      }
    }
    return results;
  });
  
  console.log('\nWindow variables containing product data:');
  console.log(JSON.stringify(windowData, null, 2));
  
  await browser.close();
  console.log('\nDone!');
}

findCentrakorAPI().catch(console.error);
