import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      // Also allow 127.0.0.1 (localhost IP)
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
    ],
    // Disable image optimization for development with localhost
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
