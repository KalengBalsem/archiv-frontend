import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Mengabaikan error linter agar build tetap jalan
    ignoreDuringBuilds: true,
  },
  /* config options here */
   /* Configure remote image domains (Cloudflare R2) */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        pathname: '/**',
      },
      // 1. Izinkan Avatar Google (Penyebab error Anda saat ini)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      // 2. Izinkan Avatar Google (Backup untuk server google lain lh4, lh5, dll)
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
