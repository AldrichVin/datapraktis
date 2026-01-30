/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@datapraktis/db', '@datapraktis/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
    ],
  },
  eslint: {
    // Skip ESLint during builds - ESLint config needs updating
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
