"use client";

import React, { useState, useEffect } from "react";
import { createPublicClient, http, formatEther } from "viem";
import { somniaTestnet } from "@/config";
import { AUTARCH_ABI } from "./lib/abis";

// Import components
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Footer from "./components/Footer";

// Import custom types
import { Bounty, BountyStatus, PipelineStep } from "./hooks/useSandbox";

// Deployed Addresses
const AUTARCH_ADDRESS = (process.env.NEXT_PUBLIC_AUTARCH_ADDRESS ||
  "0xcA83D3a6Cb7B94e6A5eF3c84e103253d119CFA82") as `0x${string}`;

export default function Home() {
  // Blockchain stats state
  const [bountiesCount, setBountiesCount] = useState(0);
  const [totalLockedSOMI, setTotalLockedSOMI] = useState("0.00");

  // Initialize public client for rapid read queries on Somnia Testnet
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  // Fetch real on-chain bounties summary for the Hero stats
  const fetchRealBountiesStats = async () => {
    try {
      // Get bounty count
      const count = (await publicClient.readContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "bountyCount",
      })) as bigint;

      setBountiesCount(Number(count));

      let sumLocked = 0;
      // Fetch each bounty's status and amount to compute total locked
      for (let i = 1; i <= Number(count); i++) {
        const data = (await publicClient.readContract({
          address: AUTARCH_ADDRESS,
          abi: AUTARCH_ABI,
          functionName: "getBounty",
          args: [BigInt(i)],
        })) as any;

        const status = Number(data.status) as BountyStatus;
        const amount = Number(formatEther(data.amount));

        if (
          status === BountyStatus.Open ||
          status === BountyStatus.UnderReview ||
          status === BountyStatus.Failed ||
          status === BountyStatus.Disputed
        ) {
          sumLocked += amount;
        }
      }
      setTotalLockedSOMI(sumLocked.toFixed(2));
    } catch (e) {
      console.error("Error reading stats from on-chain contract:", e);
    }
  };

  useEffect(() => {
    fetchRealBountiesStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Landing Hero */}
        <Hero bountiesCount={bountiesCount} totalLocked={totalLockedSOMI} />

        {/* Explainer Segment */}
        <About />
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}
