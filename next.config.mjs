import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  images: {
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
}

export default nextConfig
