/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['recharts', 'jspdf', 'mathjs'],
  },
}

module.exports = nextConfig
