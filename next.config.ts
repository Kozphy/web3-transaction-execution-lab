import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const accountsStub = join(projectRoot, "src/lib/accounts-stub.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      accounts: "./src/lib/accounts-stub.ts"
    }
  },
  webpack: (config) => {
    config.resolve.alias.accounts = accountsStub;
    return config;
  }
};

export default nextConfig;
