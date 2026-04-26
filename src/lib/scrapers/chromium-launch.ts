import { chromium as playwrightChromium } from 'playwright'

type LaunchArgs = {
  args?: string[]
}

export async function launchChromiumBrowser(options: LaunchArgs = {}) {
  if (process.env.VERCEL === '1' && process.platform === 'linux') {
    const { default: serverlessChromium } = await import('@sparticuz/chromium')

    return playwrightChromium.launch({
      args: [...serverlessChromium.args, ...(options.args || [])],
      executablePath: await serverlessChromium.executablePath(),
      headless: true,
    })
  }

  return playwrightChromium.launch({
    headless: true,
    args: options.args,
  })
}
