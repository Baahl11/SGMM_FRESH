/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ]
  },
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
}

export default nextConfig;
