import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi (or a tunnel) load the dev server, e.g. https://192.168.0.12:3000
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.ngrok-free.app", "*.trycloudflare.com"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          // The worker fetches (and caches) map tiles, so their hosts must be allowed here.
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'; connect-src 'self' https://tile.openstreetmap.org https://tiles.stadiamaps.com",
          },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
