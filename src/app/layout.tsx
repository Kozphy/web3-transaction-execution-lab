import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Web3Provider } from "@/components/wallet/Web3Provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Web3 Transaction Execution System",
  description: "Production-style Sepolia transaction execution, EIP-1559 fees, and EIP-712 signing system."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
