import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https", // or http
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
