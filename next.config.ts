import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
