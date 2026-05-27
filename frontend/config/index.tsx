import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "wagmi";
import { mainnet } from "@reown/appkit/networks";
import { defineChain } from "viem";

// Define Somnia Testnet custom chain directly to ensure version compatibility
export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
  },
  blockExplorers: {
    default: { name: "Somnia Explorer", url: "https://explorer-testnet.somnia.network" },
  },
  testnet: true,
});

// Get projectId from environment variables
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

export const networks = [mainnet, somniaTestnet];

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up the Wagmi Adapter (config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  networks,
  projectId
});

export const config = wagmiAdapter.wagmiConfig;
