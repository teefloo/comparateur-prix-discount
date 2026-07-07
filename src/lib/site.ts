const DEFAULT_SITE_URL = 'https://comparprix.vercel.app/'

export function getSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL

  try {
    const normalized = candidate.startsWith('http://') || candidate.startsWith('https://')
      ? candidate
      : `https://${candidate}`

    return new URL(normalized).origin
  } catch {
    return new URL(DEFAULT_SITE_URL).origin
  }
}

export function absoluteUrl(pathname = '/') {
  return new URL(pathname, `${getSiteUrl().replace(/\/$/, '')}/`).toString()
}

