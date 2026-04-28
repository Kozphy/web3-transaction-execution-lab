import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { cookieStorage, createStorage, http } from "wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "missing-reown-project-id";
const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const isProjectIdConfigured = projectId !== "missing-reown-project-id";
export const appKitNetworks = [sepolia] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  networks: appKitNetworks,
  projectId,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [sepolia.id]: http(rpcUrl)
  }
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: appKitNetworks,
  defaultNetwork: sepolia,
  projectId,
  metadata: {
    name: "Web3 Transaction Execution Lab",
    description: "Sepolia transaction construction, fee estimation, execution, and EIP-712 signing lab.",
    url: "https://localhost:3000",
    icons: ["https://avatars.githubusercontent.com/u/37784886"]
  },
  features: {
    analytics: false,
    email: false,
    socials: false
  },
  themeMode: "dark"
});
