"use client";

import Link from "next/link";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="w-full sticky top-0 z-50 backdrop-blur-md font-syne border-b border-border-color bg-background/70 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 relative z-50">
        {/* Grid Layout: 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 h-20 items-center text-sm">
          {/* Left: Brand */}
          <div className="flex items-center gap-4 justify-start">
            <Link
              href="/"
              className="font-bold text-xl tracking-tight text-foreground z-50 flex items-center gap-1 font-syne"
            >
              {`{`} autarch {`}`}
            </Link>
            <span className="hidden sm:inline-block font-mono text-[9px] uppercase border border-border-color px-1.5 py-0.5 rounded text-zinc-500">
              v1.0.0
            </span>
          </div>

          {/* Middle: Main Navigation */}
          <div className="hidden font-dm-sans md:flex items-center justify-center gap-10 text-zinc-500 font-medium">
            <Link href="#pipeline" className="hover:text-foreground transition">
              Pipeline
            </Link>
            <Link href="/bounties" className="hover:text-foreground transition">
              Active Bounties
            </Link>
            <a href="/dashboard" className="hover:text-foreground transition">
              Dashboard
            </a>
          </div>

          {/* Right: Connect Wallet & Mobile Toggle */}
          <div className="flex items-center justify-end gap-4 text-zinc-500 font-medium">
            <Button
              onClick={() => (window.location.href = "/bounty")}
              className="hover:text-black transition hidden lg:block"
            >
              <Plus className="inline-block w-4 h-4 mr-2" /> Create Bounty
            </Button>
            {/* Reown AppKit Button */}
            <div className="hidden sm:block">
              <appkit-button balance="show" size="md" label="Connect Wallet" />
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-foreground p-2 z-50 relative"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center gap-8 text-foreground font-syne md:hidden pt-20"
          >
            <Link
              href="#pipeline"
              onClick={toggleMenu}
              className="text-3xl font-bold tracking-tight hover:text-clay transition"
            >
              Pipeline
            </Link>
            <Link
              href="/bounties"
              onClick={toggleMenu}
              className="text-3xl font-bold tracking-tight hover:text-clay transition"
            >
              Active Bounties
            </Link>
            <Link
              href="/dashboard"
              onClick={toggleMenu}
              className="text-3xl font-bold tracking-tight hover:text-clay transition"
            >
              Dashboard
            </Link>

            <div className="w-32 h-[1px] bg-border-color my-2" />

            <div className="mt-2" onClick={toggleMenu}>
              <appkit-button balance="show" size="md" label="Connect Wallet" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
