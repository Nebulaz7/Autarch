"use client";

import React from "react";
import { Layers } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border-color py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Left Side Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#191919] dark:bg-[#F5F5F5] flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            AUTARCH
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          <a
            href="https://somnia.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Somnia L1 Network
          </a>
          <a
            href="https://explorer-testnet.somnia.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Somnia Block Explorer
          </a>
          <a
            href="https://cloud.reown.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Reown Cloud Dashboard
          </a>
        </div>

        {/* Copyright */}
        <div className="font-mono text-[10px] text-zinc-400">
          &copy; {new Date().getFullYear()} Autarch Protocol. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
