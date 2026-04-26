import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function scrapeWithBrowserUse() {
  console.log('🚀 Starting browser-use scraping for Action...')
  
  // Open Action page
  console.log('📍 Opening Action hygiene category...')
  await execAsync('browser-use open "https://www.action.com/fr-fr/catalogue/hygiene-beaute/"')
  
  // Wait for page to load
  await new Promise(r => setTimeout(r, 10000))
  
  // Get page state to see what's available
  console.log('🔍 Getting page state...')
  try {
    const { stdout } = await execAsync('browser-use --json state')
    console.log('Page state:', stdout.substring(0, 2000))
  } catch (e: any) {
    console.log('State error:', e.message)
  }
  
  // Try to get HTML
  console.log('📄 Getting page HTML...')
  try {
    const { stdout: html } = await execAsync('browser-use --json get html')
    console.log('HTML length:', html.length)
  } catch (e: any) {
    console.log('HTML error:', e.message)
  }
  
  // Close browser
  await execAsync('browser-use close')
  
  console.log('✅ Done!')
}

scrapeWithBrowserUse().catch(console.error)