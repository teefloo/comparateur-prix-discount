/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
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
    ],
  },
}

export default nextConfig
