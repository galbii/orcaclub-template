import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by the Dockerfile — emits .next/standalone with a minimal
  // server.js and only the node_modules actually reachable at runtime.
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@/components/ui', '@/hooks', '@/utilities'],
  },
  images: {
    remotePatterns: [
      NEXT_PUBLIC_SERVER_URL,
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    ]
      .filter(Boolean)
      .map((item) => {
        const url = new URL(item)
        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
