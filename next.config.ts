import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow large AI responses
  serverExternalPackages: ['@anthropic-ai/sdk'],
}

export default nextConfig
