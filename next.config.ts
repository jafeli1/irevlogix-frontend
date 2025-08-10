import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/asset-recovery/intake-audit', destination: '/asset-recovery/asset-intake', permanent: true },
      { source: '/asset-recovery/tracking', destination: '/asset-recovery/asset-tracking', permanent: true },
    ];
  },
};

export default nextConfig;
