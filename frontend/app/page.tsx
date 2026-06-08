"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { createPublicClient, http, parseEther, formatEther } from "viem";
import { somniaTestnet } from "@/config";
import { AUTARCH_ABI, REGISTRY_ABI, ARBITER_ABI } from "./lib/abis";

// Import components
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import BountyList from "./components/BountyList";
import BountyDetail from "./components/BountyDetail";
import CreateBountyModal from "./components/CreateBountyModal";
import SubmitWorkModal from "./components/SubmitWorkModal";
import Footer from "./components/Footer";

// Import custom types
import {
  Bounty,
  BountyStatus,
  PipelineStep,
} from "./hooks/useSandbox";
import { Plus } from "lucide-react";

// Deployed Addresses
const AUTARCH_ADDRESS = (process.env.NEXT_PUBLIC_AUTARCH_ADDRESS ||
  "0xcA83D3a6Cb7B94e6A5eF3c84e103253d119CFA82") as `0x${string}`;
const ARBITER_ADDRESS = (process.env.NEXT_PUBLIC_ARBITER_ADDRESS ||
  "0x342B39A610F0d415C7a31CC9E2C586C04C0f1f04") as `0x${string}`;
const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ||
  "0x90d63D11281B036CdD4ec55A84169029E4a93D6a") as `0x${string}`;

export default function Home() {
  const [selectedBountyId, setSelectedBountyId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Wagmi/Web3 wallet details
  const { address: userAddress, isConnected } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Blockchain state
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [bountiesLoading, setBountiesLoading] = useState(false);

  // Initialize public client for rapid read queries on Somnia Testnet
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  // Fetch real on-chain bounties
  const fetchRealBounties = async () => {
    setBountiesLoading(true);
    try {
      // Get bounty count
      const count = (await publicClient.readContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "bountyCount",
      })) as bigint;

      const loaded: Bounty[] = [];
      // Fetch each bounty's data
      for (let i = 1; i <= Number(count); i++) {
        const data = (await publicClient.readContract({
          address: AUTARCH_ADDRESS,
          abi: AUTARCH_ABI,
          functionName: "getBounty",
          args: [BigInt(i)],
        })) as any;

        // Parse struct fields
        loaded.push({
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
      }
      setBounties(loaded.reverse());
    } catch (e) {
      console.error("Error reading on-chain contract:", e);
    } finally {
      setBountiesLoading(false);
    }
  };

  useEffect(() => {
    fetchRealBounties();
  }, [isTxSuccess]);

  const currentBounty =
    bounties.find((b) => b.id === selectedBountyId) || null;

  // Escrow locked SOMI calculation
  const totalLockedSOMI = bounties
    .filter(
      (b) =>
        b.status === BountyStatus.Open ||
        b.status === BountyStatus.UnderReview ||
        b.status === BountyStatus.Failed ||
        b.status === BountyStatus.Disputed,
    )
    .reduce((sum, b) => sum + Number(b.amount), 0)
    .toFixed(2);

  // --- CONTRACT TRANSACTION TRIGGERS ---
  const handleCreateBounty = async (spec: string, amount: string) => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      writeContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "createBounty",
        args: [spec],
        value: parseEther(amount),
      });
    } catch (e) {
      console.error("Create bounty transaction failed:", e);
    }
  };

  const handleSubmitWork = async (prUrl: string, previewUrl: string) => {
    if (selectedBountyId === null) return;

    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      writeContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "submitWork",
        args: [BigInt(selectedBountyId), prUrl, previewUrl],
      });
    } catch (e) {
      console.error("Submit work transaction failed:", e);
    }
  };

  const handleRaiseDispute = async (bountyId: number) => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      writeContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "raiseDispute",
        args: [BigInt(bountyId)],
      });
    } catch (e) {
      console.error("Raise dispute transaction failed:", e);
    }
  };

  const handleSettleDispute = async (bountyId: number, approved: boolean) => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      // Settle dispute via Arbiter wrapper
      writeContract({
        address: ARBITER_ADDRESS,
        abi: ARBITER_ABI,
        functionName: "resolveDispute",
        args: [BigInt(bountyId), approved],
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

        {selectedBountyId === null ? (
          <>
            {/* Landing Hero */}
            <Hero
              bountiesCount={bounties.length}
              totalLocked={totalLockedSOMI}
            />

            {/* Explainer Segment */}
            <About />

            {/* List Segment */}
            <section id="escrows" className="py-12 border-t border-border-color">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-clay">
                    Active Ledger
                  </span>
                  <h2 className="font-serif text-3xl font-normal leading-tight text-foreground tracking-tight mt-1">
                    Explore Escrow Agreements
                  </h2>
                </div>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-5 py-2.5 bg-[#191919] hover:bg-zinc-800 text-[#fbf9f6] dark:bg-[#f5f5f5] dark:text-[#141413] dark:hover:bg-zinc-200 text-xs font-mono uppercase tracking-wider rounded flex items-center gap-2 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Post New Escrow
                </button>
              </div>

              {bountiesLoading ? (
                <div className="py-20 text-center thin-border rounded-lg bg-card-bg">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-clay border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="text-xs text-zinc-500 mt-3 font-mono">
                    Querying Somnia block states...
                  </p>
                </div>
              ) : (
                <BountyList
                  bounties={bounties}
                  onSelectBounty={(b) => setSelectedBountyId(b.id)}
                />
              )}
            </section>
          </>
        ) : (
          <BountyDetail
            bounty={currentBounty!}
            userAddress={userAddress || ""}
            onBack={() => setSelectedBountyId(null)}
            onSubmitWork={() => setSubmitModalOpen(true)}
            onRaiseDispute={handleRaiseDispute}
            onSettleDispute={handleSettleDispute}
          />
        )}
      </main>

      {/* Modals */}
      <CreateBountyModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateBounty}
      />

      <SubmitWorkModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={handleSubmitWork}
      />

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}
