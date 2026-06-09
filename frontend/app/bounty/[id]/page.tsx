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
import { AUTARCH_ABI, ARBITER_ABI } from "../../lib/abis";

// Import components
import Navbar from "../../components/Navbar";
import BountyDetail from "../../components/BountyDetail";
import Footer from "../../components/Footer";

// Import custom types
import { Bounty, BountyStatus, PipelineStep } from "../../hooks/useSandbox";

// Deployed Addresses
const AUTARCH_ADDRESS = (process.env.NEXT_PUBLIC_AUTARCH_ADDRESS ||
  "0xcA83D3a6Cb7B94e6A5eF3c84e103253d119CFA82") as `0x${string}`;
const ARBITER_ADDRESS = (process.env.NEXT_PUBLIC_ARBITER_ADDRESS ||
  "0x342B39A610F0d415C7a31CC9E2C586C04C0f1f04") as `0x${string}`;

interface BountyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BountyDetailPage({ params }: BountyDetailPageProps) {
  const router = useRouter();
  const { id: rawId } = React.use(params);
  const bountyId = Number(rawId);

  // Wagmi/Web3 wallet details
  const { address: userAddress, isConnected } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // State
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [bountyLoading, setBountyLoading] = useState(true);

  // Initialize public client for rapid read queries on Somnia Testnet
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  // Fetch real on-chain bounty detail
  const fetchSingleBounty = async () => {
    setBountyLoading(true);
    try {
      const data = (await publicClient.readContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "getBounty",
        args: [BigInt(bountyId)],
      })) as any;

      if (!data || Number(data.id) === 0) {
        setBounty(null);
        return;
      }

      setBounty({
        id: Number(data.id),
        poster: data.poster,
        developer:
          data.developer === "0x0000000000000000000000000000000000000000"
            ? ""
            : data.developer,
        amount: formatEther(data.amount),
        spec: data.spec,
        prUrl: data.prUrl,
        previewUrl: data.previewUrl,
        status: Number(data.status) as BountyStatus,
        step: Number(data.step) as PipelineStep,
        codeDiff: data.codeDiff || "",
        uiScrape: data.uiScrape || "",
        logs: [
          `[Somnia L1 API Agent] Registered on-chain escrow request details.`,
          `[Status Update] Current bounty status: ${BountyStatus[Number(data.status)]}`,
        ],
        requestId: Number(data.requestId),
        createdAt: Number(data.createdAt) * 1000,
        submittedAt: Number(data.submittedAt) * 1000,
        disputeDeadline: Number(data.disputeDeadline) * 1000,
        confidence: 0,
      });
    } catch (e) {
      console.error("Error reading single bounty details:", e);
      setBounty(null);
    } finally {
      setBountyLoading(false);
    }
  };

  useEffect(() => {
    fetchSingleBounty();
  }, [bountyId, isTxSuccess]);

  // Poll for updates every 30s while the bounty is under AI review
  useEffect(() => {
    if (!bounty || bounty.status !== BountyStatus.UnderReview) return;

    const interval = setInterval(() => {
      fetchSingleBounty();
    }, 30_000);

    return () => clearInterval(interval);
  }, [bounty?.status]);

  // --- CONTRACT TRANSACTION TRIGGERS ---
  const handleRaiseDispute = async (bId: number) => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      writeContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "raiseDispute",
        args: [BigInt(bId)],
      });
    } catch (e) {
      console.error("Raise dispute transaction failed:", e);
    }
  };

  const handleSettleDispute = async (bId: number, approved: boolean) => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      writeContract({
        address: ARBITER_ADDRESS,
        abi: ARBITER_ABI,
        functionName: "resolveDispute",
        args: [BigInt(bId), approved],
      });
    } catch (e) {
      console.error("Arbiter dispute resolution failed:", e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Real-time transaction loader overlay */}
        {isTxConfirming && (
          <div className="my-4 p-4 border border-amber-200 bg-amber-50 dark:border-zinc-800 dark:bg-zinc-950 rounded-lg flex items-center gap-3 text-xs font-mono text-amber-700 dark:text-amber-500">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>Somnia Transaction Confirming on-chain... Please wait.</span>
          </div>
        )}

        {bountyLoading ? (
          <div className="py-20 text-center thin-border rounded-lg bg-card-bg">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-clay border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-xs text-zinc-500 mt-3 font-mono">
              Loading escrow specifications...
            </p>
          </div>
        ) : bounty === null ? (
          <div className="py-20 text-center thin-border rounded-lg bg-card-bg">
            <h2 className="text-xl font-serif text-foreground">
              Escrow Not Found
            </h2>
            <p className="text-xs text-zinc-500 mt-3 font-mono">
              The requested escrow contract does not exist or has invalid
              states.
            </p>
            <button
              onClick={() => router.push("/bounty")}
              className="mt-6 px-4 py-2 bg-[#191919] hover:bg-zinc-800 text-[#fbf9f6] text-xs font-mono uppercase rounded"
            >
              Back to Explorer
            </button>
          </div>
        ) : (
          <BountyDetail
            bounty={bounty}
            userAddress={userAddress || ""}
            onBack={() => router.push("/bounty")}
            onSubmitWork={() => router.push(`/bounty/${bountyId}/submit`)}
            onRaiseDispute={handleRaiseDispute}
            onSettleDispute={handleSettleDispute}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}
