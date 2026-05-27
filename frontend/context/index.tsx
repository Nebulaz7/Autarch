"use client";

import { wagmiAdapter, projectId, somniaTestnet } from "@/config";
import { createAppKit } from "@reown/appkit/react";
import { mainnet } from "@reown/appkit/networks";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up metadata
const metadata = {
  name: "Autarch Escrow Protocol",
  description: "Autonomous On-Chain Escrow backed by decentralized AI agent pipelines on Somnia Network.",
  url: "https://autarch-protocol.com",
  icons: ["https://avatars.githubusercontent.com/u/179229932"]
};

// Create the Reown AppKit modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, somniaTestnet],
  metadata: metadata,
  features: {
    analytics: true,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#D97757", // Set to matches our terracotta --swatch--clay color!
    "--w3m-border-radius-master": "6px",
    "--w3m-font-family": "var(--font-sans)",
  }
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
