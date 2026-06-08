"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import MagicRings from "./animations/MagicRings";
import { motion } from "framer-motion";

interface HeroProps {
  bountiesCount: number;
  totalLocked: string;
}

const Hero = ({ bountiesCount, totalLocked }: HeroProps) => {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center w-full overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0 opacity-50 flex items-center justify-center">
        <div className="w-full h-full max-w-7xl max-h-[1024px]">
          <MagicRings
            color="#58A0B4"
            colorTwo="#FFFFFF"
            ringCount={6}
            speed={1}
            attenuation={20}
            lineThickness={2}
            baseRadius={0.35}
            radiusStep={0.1}
            scaleRate={0.2}
            opacity={1}
            blur={0}
            noiseAmount={0.1}
            rotation={0}
            ringGap={1.5}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            mouseInfluence={0}
            hoverScale={1}
            parallax={0.05}
            clickBurst={false}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 mt-8 relative z-10 flex flex-col items-center">
        {/* Tag / Badge
        <motion.div
          initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono font-medium tracking-wide uppercase text-gray-300"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Autonomous Bounty Verifier
        </motion.div> */}

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-3xl md:text-5xl font-syne tracking-tight text-white leading-tight"
        >
          <span className="font-bold">Code</span> shouldn't just be{" "}
          <span className="font-bold">Written</span>, it should be{" "}
          <span className="font-bold">Verified</span>.
        </motion.h1>

        {/* Subheading */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="space-y-4"
        >
          <p className="text-base md:text-lg text-gray-400 font-dm-sans max-w-2xl mx-auto leading-relaxed">
            <span className="underline text-gray-300">
              The first autonomous
            </span>{" "}
            code reviewer that handles the payout. <br /> AI consensus. Verified
            code. Instant payouts. Powered by Somnia.
          </p>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="flex items-center justify-center gap-4 pt-2"
        >
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-syne transition-all shadow-lg hover:scale-102 animate-fade-in"
            onClick={() => {
              window.location.href = "/bounty";
            }}
          >
            Explore Bounties
          </Button>
        </motion.div>

        {/* Real-time stats */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 pt-8 text-xs font-mono uppercase tracking-wider text-gray-400"
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{bountiesCount}</span> Active
            Bounties
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{totalLocked} SOMI</span>{" "}
            Total Locked
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">3 Agents</span> Consensus
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
