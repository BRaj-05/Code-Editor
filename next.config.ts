import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
