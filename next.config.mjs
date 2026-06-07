import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: 'asset.action.com' },
      { protocol: 'https', hostname: 'www.action.com' },
      { protocol: 'https', hostname: 'www.gifi.fr' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'www.lidl.fr' },
      { protocol: 'https', hostname: 'www.centrakor.com' },
      { protocol: 'https', hostname: 'bmstores.fr' },
      { protocol: 'https', hostname: 'www.aldi.fr' },
      { protocol: 'https', hostname: 'www.noz.fr' },
      { protocol: 'https', hostname: 'www.lafoirfouille.fr' },
      { protocol: 'https', hostname: 's7g10.scene7.com' },
      { protocol: 'https', hostname: 'imgproxy-retcat.assets.schwarz' },
      { protocol: 'https', hostname: '**.omn.proximis.com' },
    ],
  },
  async headers() {
    const cdnPreconnects = [
      '<https://cdn.shopify.com>; rel=preconnect; crossorigin',
      '<https://asset.action.com>; rel=preconnect; crossorigin',
      '<https://s7g10.scene7.com>; rel=preconnect; crossorigin',
      '<https://imgproxy-retcat.assets.schwarz>; rel=preconnect; crossorigin',
      '<https://www.gifi.fr>; rel=preconnect',
      '<https://www.centrakor.com>; rel=preconnect',
      '<https://www.lidl.fr>; rel=preconnect',
      '<https://www.aldi.fr>; rel=preconnect',
      '<https://bmstores.fr>; rel=preconnect',
      '<https://www.noz.fr>; rel=preconnect',
      '<https://www.lafoirfouille.fr>; rel=preconnect',
    ].join(', ')

    const cspReportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.vercel-postgres.com https://*.vercel.com https://www.google-analytics.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
    ]

    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Link', value: cdnPreconnects },
        ],
      },
      {
        source: '/brand/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
}

export default nextConfig
