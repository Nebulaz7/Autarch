"use client";

import React from "react";
import { Layers } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border-color py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left Side Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-bold text-xl tracking-tight text-foreground z-50 flex items-center gap-1 font-syne"
          >
            <span className="text-clay">{`{`}</span> autarch{" "}
            <span className="text-clay">{`}`}</span>
          </Link>
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
            href="https://github.com/Nebulaz7/Autarch"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Github
          </a>
        </div>

        {/* Copyright */}
        <div className="font-mono text-[10px] text-zinc-400">
          &copy; {new Date().getFullYear()} Autarch Protocol. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
