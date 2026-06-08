import type { Metadata } from "next";
import "@fontsource/syne/400.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "@fontsource/syne/800.css";
import "@fontsource/dm-sans/300.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Autarch Escrow Protocol",
  description:
    "Autonomous On-Chain Escrow secured by decentralized AI agent pipelines on Somnia Network.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read cookies for SSR hydration hydration consistency with Wagmi Adapter
  const headerList = await headers();
  const cookies = headerList.get("cookie");

  return (
    <html lang="en" className={cn("h-full", "antialiased")}>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
