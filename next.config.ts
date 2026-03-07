import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/storage/:path*',
        destination: 'https://icgowa.sch.id/unelma.id/uploads/:path*',
      },
      {
        source: '/api-upload.php',
        destination: 'https://icgowa.sch.id/unelma.id/api-upload.php',
      },
    ];
  },
};

export default nextConfig;
