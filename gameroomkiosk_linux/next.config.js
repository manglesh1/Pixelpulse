/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: '.next-export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
