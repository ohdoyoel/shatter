import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
};

export default nextConfig;
