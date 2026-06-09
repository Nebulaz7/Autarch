"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { createPublicClient, http, formatEther } from "viem";
import { somniaTestnet } from "@/config";
import { AUTARCH_ABI } from "../../../lib/abis";
import {
  GitPullRequest,
  Eye,
  HelpCircle,
  ArrowLeft,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Import components
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

// Deployed Addresses
const AUTARCH_ADDRESS = (process.env.NEXT_PUBLIC_AUTARCH_ADDRESS ||
  "0xcA83D3a6Cb7B94e6A5eF3c84e103253d119CFA82") as `0x${string}`;

interface SubmitPageProps {
  params: Promise<{ id: string }>;
}

export default function SubmitWorkPage({ params }: SubmitPageProps) {
  const router = useRouter();
  const { id: rawId } = React.use(params);
  const bountyId = Number(rawId);

  // Wagmi/Web3 wallet details
  const { isConnected } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // State
  const [prUrl, setPrUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [bountySpec, setBountySpec] = useState("");
  const [bountyAmount, setBountyAmount] = useState("");
  const [loadingBounty, setLoadingBounty] = useState(true);

  // Initialize public client for Somnia Testnet
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  // Fetch the summary details of the bounty
  const fetchBountySummary = async () => {
    try {
      const data = (await publicClient.readContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "getBounty",
        args: [BigInt(bountyId)],
      })) as any;

      if (data && Number(data.id) !== 0) {
        setBountySpec(data.spec);
        setBountyAmount(formatEther(data.amount));
      }
    } catch (e) {
      console.error("Error reading bounty details for submission page:", e);
    } finally {
      setLoadingBounty(false);
    }
  };

  useEffect(() => {
    fetchBountySummary();
  }, [bountyId]);

  // Handle redirect after transaction success
  useEffect(() => {
    if (isTxSuccess) {
      router.push(`/bounty/${bountyId}`);
    }
  }, [isTxSuccess, bountyId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!prUrl.trim() || !prUrl.includes("github.com")) {
      setError("A valid GitHub Pull Request URL is required");
      return;
    }

    if (
      !previewUrl.trim() ||
      (!previewUrl.startsWith("http://") && !previewUrl.startsWith("https://"))
    ) {
      setError(
        "A valid live preview URL starting with http:// or https:// is required",
      );
      return;
    }

    try {
      writeContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "submitWork",
        args: [BigInt(bountyId), prUrl, previewUrl],
      });
    } catch (err) {
      console.error("Submit work transaction failed:", err);
      setError("Failed to execute on-chain contract submission.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/bounty/${bountyId}`)}
          className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 hover:text-foreground mb-8 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Details
        </button>

        {/* Real-time transaction loader overlay */}
        {isTxConfirming && (
          <div className="my-4 p-4 border border-amber-200 bg-amber-50 dark:border-zinc-800 dark:bg-zinc-950 rounded-lg flex items-center gap-3 text-xs font-mono text-amber-700 dark:text-amber-500">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>
              Somnia Transaction Confirming on-chain... Routing back soon.
            </span>
          </div>
        )}

        <div className="p-8 bg-card-bg thin-border rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-border-color pb-6 mb-6">
            <span className="font-mono text-xs text-zinc-400">
              Escrow Account #{bountyId}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal leading-tight text-foreground tracking-tight mt-1">
              Submit Work Delivery
            </h1>

            {/* Escrow summary context box */}
            {!loadingBounty && bountySpec && (
              <div className="mt-4 p-4 bg-background thin-border rounded-md flex justify-between items-start gap-4">
                <div className="flex-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    Specification
                  </span>
                  <p className="font-serif text-sm italic text-zinc-600 dark:text-zinc-300 line-clamp-2 mt-1">
                    "{bountySpec}"
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Reward
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="w-3.5 h-3.5 text-clay" />
                    <span className="font-mono text-foreground font-semibold">
                      {bountyAmount} SOMI
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-zinc-900 dark:border-zinc-800 rounded text-rose-600 text-xs font-mono">
                {error}
              </div>
            )}

            {/* 1. Git PR */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                GitHub Pull Request URL
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <GitPullRequest className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="https://github.com/org/repo/pull/42"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 text-sm bg-card-bg border border-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all text-foreground"
                  required
                />
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal">
                The git code diff of the changes will be fetched by the Somnia
                API Agent.
              </p>
            </div>

            {/* 2. Preview Link */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                Live Preview URL
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Eye className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="https://my-preview-link.vercel.app"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 text-sm bg-card-bg border border-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all text-foreground"
                  required
                />
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal">
                The live interface layout of the deployment will be fetched by
                the Somnia Headless Crawler.
              </p>
            </div>

            {/* Warning / Instruction */}
            <div className="p-4 border border-foreground bg-background flex gap-3 text-xs text-foreground leading-relaxed">
              <HelpCircle className="w-6 h-6 text-[#d97757] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">
                  Triggering AI Pipelines:
                </span>{" "}
                After submitting, the smart contract automatically schedules the
                3-step AI agent verification flow. This in-memory evaluation
                takes ~8 seconds to simulate and logs real-time console
                consensus checks.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
              <button
                type="button"
                onClick={() => router.push(`/bounty/${bountyId}`)}
                className="px-4 py-2 bg-card-bg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono uppercase tracking-wider rounded thin-border transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                className="hover:text-black transition hidden lg:block"
              >
                Submit Work & Verify
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}
