import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Leave this empty to use default settings
  },
  // Disabling source maps in dev can save hundreds of MBs of RAM
    productionBrowserSourceMaps: false,
  // This helps prevent the "Watchpack" process from over-scanning files
    webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;
