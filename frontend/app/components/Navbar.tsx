"use client";

import React from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Layers } from "lucide-react";

interface NavbarProps {}

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border-color transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#191919] dark:bg-[#F5F5F5] flex items-center justify-center">
            <Layers className="w-4 h-4 text-background" />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            AUTARCH
          </span>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase border border-border-color px-1.5 py-0.5 rounded text-zinc-500">
            v1.0.0
          </span>
        </div>

        {/* Action Items */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* Somnia Network Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md thin-border bg-card-bg text-xs font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-clay"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-clay"></span>
            </span>
            <span className="text-foreground font-mono">
              Somnia Network
            </span>
          </div>

          {/* Web3 Wallet Connection */}
          <div className="flex items-center gap-2">
            {/* Reown AppKit Button */}
            <appkit-button balance="show" size="md" label="Connect Wallet" />
          </div>

        </div>
      </div>
    </header>
  );
}
