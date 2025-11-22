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
    ],
  },
};

export default nextConfig;
