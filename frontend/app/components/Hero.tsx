"use client";

import React from "react";
import { motion } from "framer-motion";
import { Coins, Cpu, ShieldCheck } from "lucide-react";

interface HeroProps {
  bountiesCount: number;
  totalLocked: string;
}

export default function Hero({ bountiesCount, totalLocked }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="py-20 bg-background transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6"
        >
          {/* Tag */}
          <motion.div
            variants={itemVariants}
            className="px-3 py-1 bg-card-bg thin-border rounded text-xs font-mono font-medium tracking-wide uppercase text-zinc-500"
          >
            Decentralized Escrow Protocol
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="font-serif text-4xl sm:text-6xl font-normal leading-tight text-foreground tracking-tight max-w-3xl"
          >
            On-chain escrow with autonomous <span className="italic font-light text-clay">AI validation</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="font-sans text-base sm:text-lg leading-relaxed text-zinc-500 max-w-2xl"
          >
            Autarch secures peer-to-peer agreements on the Somnia Network. Post specifications, lock funds, and let the 3-step AI Agent consensus pipeline automatically verify code diffs and visual preview deployments for instant payout.
          </motion.p>

          {/* Spacer */}
          <div className="h-6" />

          {/* Stat Cards Grid */}
          <motion.div
            variants={itemVariants}
            className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 text-left"
          >
            {/* Stat 1 */}
            <div className="p-6 bg-card-bg thin-border rounded-lg relative overflow-hidden flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-500">Active Escrows</span>
                <Coins className="w-4 h-4 text-clay" />
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl font-medium text-foreground">{bountiesCount}</span>
                <p className="text-[11px] text-zinc-400 mt-1">Smart contracts currently active</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-6 bg-card-bg thin-border rounded-lg relative overflow-hidden flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-500">Total Locked Value</span>
                <ShieldCheck className="w-4 h-4 text-clay" />
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl font-medium text-foreground">{totalLocked} SOMI</span>
                <p className="text-[11px] text-zinc-400 mt-1">Funds secured on Somnia L1</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-6 bg-card-bg thin-border rounded-lg relative overflow-hidden flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-500">Validation Nodes</span>
                <Cpu className="w-4 h-4 text-clay" />
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl font-medium text-foreground">3 Agents</span>
                <p className="text-[11px] text-zinc-400 mt-1">Consensus-driven AI execution</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
