import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi (or a tunnel) load the dev server, e.g. https://192.168.0.12:3000
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.ngrok-free.app", "*.trycloudflare.com"],
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
