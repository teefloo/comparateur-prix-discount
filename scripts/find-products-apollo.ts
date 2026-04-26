import { chromium } from 'playwright';

async function findProductsInApollo() {
  console.log('Finding products in Apollo state...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  
  await page.goto('https://www.centrakor.com/bain-et-beaute.html', { 
    waitUntil: 'domcontentloaded', 
    timeout: 15000 
  });
  
  await page.waitForTimeout(5000);
  
  // Extract Apollo state
  const apolloData = await page.evaluate(() => {
    const apollo = (window as any).__APOLLO_STATE__;
    if (!apollo) return { error: 'No Apollo state found' };
    
    // Look for product-related keys
    const productKeys = Object.keys(apollo).filter(k => 
      k.includes('Product') || k.includes('product') || k.includes('Listing')
    );
    
    console.log('Product-related keys:', productKeys);
    
    // Find any key that looks like it contains product data
    const allKeys = Object.keys(apollo);
    console.log('All root keys:', allKeys.slice(0, 30));
    
    // Look for category data
    const categoryKeys = Object.keys(apollo).filter(k => k.includes('Category') || k.includes('category'));
    console.log('Category keys:', categoryKeys);
    
    // Get a sample of the data
    const sample: Record<string, any> = {};
    for (const key of allKeys.slice(0, 5)) {
      try {
        sample[key] = JSON.parse(JSON.stringify(apollo[key]));
      } catch {
        sample[key] = String(apollo[key]).substring(0, 200);
      }
    }
    
    return {
      productKeys,
      categoryKeys,
      sample
    };
  });
  
  console.log('\nApollo data:');
  console.log(JSON.stringify(apolloData, null, 2));
  
  await browser.close();
}

findProductsInApollo().catch(console.error);
