import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow connections from the local network IP
  allowedDevOrigins: ['172.20.10.3'],

  // PWA Configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
