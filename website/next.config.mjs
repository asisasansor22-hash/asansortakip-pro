import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/gizlilik-politikasi#english-summary", permanent: true },
      { source: "/privacy", destination: "/gizlilik-politikasi#english-summary", permanent: true }
    ];
  }
};

export default nextConfig;
