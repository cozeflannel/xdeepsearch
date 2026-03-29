import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    DESEARCH_API_KEY: process.env.DESEARCH_API_KEY,
  },
  turbopack: {
    root: '/Users/user/projects/desearch-dashboard',
  },
}

export default nextConfig
