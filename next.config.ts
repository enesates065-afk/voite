import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["iyzipay"],
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/iyzipay/**/*'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
