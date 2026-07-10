import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", "@node-rs/argon2"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
