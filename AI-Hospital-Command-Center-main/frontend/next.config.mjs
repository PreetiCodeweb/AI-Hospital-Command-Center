/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  async rewrites() {
    return [{
      source: '/api/:path*',
      destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/:path*`,
    }];
  },
};

export default nextConfig;
