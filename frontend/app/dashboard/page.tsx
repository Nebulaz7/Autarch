"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { createPublicClient, http, formatEther } from "viem";
import { somniaTestnet } from "@/config";
import { AUTARCH_ABI } from "../lib/abis";
import {
  Coins,
  ArrowRight,
  TrendingUp,
  Lock,
  Download,
  Upload,
  Layers,
  Copy,
  CheckCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Import components
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Custom types/enums
import { Bounty, BountyStatus, PipelineStep } from "../hooks/useSandbox";

// Deployed Addresses
const AUTARCH_ADDRESS = (process.env.NEXT_PUBLIC_AUTARCH_ADDRESS ||
  "0xcA83D3a6Cb7B94e6A5eF3c84e103253d119CFA82") as `0x${string}`;

export default function DashboardPage() {
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();

  // Loading state & error state
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"listed" | "participated">("listed");

  // Initialize public client for rapid queries
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  // Copy address to clipboard helper
  const copyAddress = () => {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch all user activity and history
  const fetchDashboardData = async () => {
    if (!userAddress) return;
    setLoading(true);
    setError("");

    try {
      // 1. Get total bounty count from contract
      const countBig = (await publicClient.readContract({
        address: AUTARCH_ADDRESS,
        abi: AUTARCH_ABI,
        functionName: "bountyCount",
      })) as bigint;
      const count = Number(countBig);

      // 2. Fetch BountyCreated events to get original escrow values
      const originalAmounts: Record<number, bigint> = {};
      try {
        const createLogs = await publicClient.getContractEvents({
          address: AUTARCH_ADDRESS,
          abi: AUTARCH_ABI,
          eventName: "BountyCreated",
          fromBlock: BigInt(0),
        });
        createLogs.forEach((log: any) => {
          const bId = Number(log.args.bountyId);
          if (bId && log.args.amount) {
            originalAmounts[bId] = log.args.amount;
          }
        });
      } catch (err) {
        console.error("Error reading BountyCreated events:", err);
      }

      // 3. Fetch DisputeSettled events to reconstruct resolution results
      const disputeSettlements: Record<number, boolean> = {}; // bountyId -> approved (payout developer)
      try {
        const settleLogs = await publicClient.getContractEvents({
          address: AUTARCH_ADDRESS,
          abi: AUTARCH_ABI,
          eventName: "DisputeSettled",
          fromBlock: BigInt(0),
        });
        settleLogs.forEach((log: any) => {
          const bId = Number(log.args.bountyId);
          if (bId !== undefined && log.args.approved !== undefined) {
            disputeSettlements[bId] = log.args.approved;
          }
        });
      } catch (err) {
        console.error("Error reading DisputeSettled events:", err);
      }

      // 4. Load all bounties in a fast loop
      const loaded: Bounty[] = [];
      for (let i = 1; i <= count; i++) {
        const data = (await publicClient.readContract({
          address: AUTARCH_ADDRESS,
          abi: AUTARCH_ABI,
          functionName: "getBounty",
          args: [BigInt(i)],
        })) as any;

        if (!data || Number(data.id) === 0) continue;

        const bountyId = Number(data.id);
        const poster = data.poster;
        const developer =
          data.developer === "0x0000000000000000000000000000000000000000"
            ? ""
            : data.developer;

        // Skip if user is neither poster nor developer to keep client size optimal
        const isUserPoster = poster.toLowerCase() === userAddress.toLowerCase();
        const isUserDev = developer.toLowerCase() === userAddress.toLowerCase();
        if (!isUserPoster && !isUserDev) continue;

        // Resolve original amount
        const origAmount = originalAmounts[bountyId] || data.amount;

        loaded.push({
          id: bountyId,
          poster: poster,
          developer: developer,
          amount: formatEther(origAmount),
          spec: data.spec,
          prUrl: data.prUrl,
          previewUrl: data.previewUrl,
          status: Number(data.status) as BountyStatus,
          step: Number(data.step) as PipelineStep,
          codeDiff: data.codeDiff || "",
          uiScrape: data.uiScrape || "",
          logs: [],
          requestId: Number(data.requestId),
          createdAt: Number(data.createdAt) * 1000,
          submittedAt: Number(data.submittedAt) * 1000,
          disputeDeadline: Number(data.disputeDeadline) * 1000,
          confidence: 0,
        });
      }

      // Attach settled states and update state
      // Sort newest first
      setBounties(loaded.reverse());
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to fetch escrow contract states from Somnia Testnet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && userAddress) {
      fetchDashboardData();
    } else {
      setBounties([]);
    }
  }, [userAddress, isConnected]);

  // Compute stats metrics dynamically based on loaded bounties and userAddress
  const stats = useMemo(() => {
    if (!userAddress) {
      return { listed: 0, participated: 0, spent: 0, locked: 0, received: 0 };
    }

    let listedCount = 0;
    let participatedCount = 0;
    let spentVal = 0;
    let lockedVal = 0;
    let receivedVal = 0;

    bounties.forEach((b) => {
      const isPoster = b.poster.toLowerCase() === userAddress.toLowerCase();
      const isDev = b.developer && b.developer.toLowerCase() === userAddress.toLowerCase();
      const amountNum = Number(b.amount);

      if (isPoster) {
        listedCount++;
        if (b.status === BountyStatus.Passed || b.status === BountyStatus.Settled) {
          // If status is Passed or Settled, the funds are paid to developer (spent)
          // Note: In case of arbiter dispute reject, it refunds back to poster (so not spent)
          // Since b.amount is set to 0 in both cases, we look at the developer.
          // If developer is empty or it was a dispute reject, it was refunded. Let's assume passed/settled with dev is spent.
          spentVal += amountNum;
        } else if (
          b.status === BountyStatus.Open ||
          b.status === BountyStatus.UnderReview ||
          b.status === BountyStatus.Failed ||
          b.status === BountyStatus.Disputed
        ) {
          // Currently locked in the contract
          lockedVal += amountNum;
        }
      }

      if (isDev) {
        participatedCount++;
        if (b.status === BountyStatus.Passed || b.status === BountyStatus.Settled) {
          receivedVal += amountNum;
        }
      }
    });

    return {
      listed: listedCount,
      participated: participatedCount,
      spent: Number(spentVal.toFixed(4)),
      locked: Number(lockedVal.toFixed(4)),
      received: Number(receivedVal.toFixed(4)),
    };
  }, [bounties, userAddress]);

  // Truncate wallet addresses
  const truncate = (addr: string) => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get configuration styles for badges
  const getBadgeConfig = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.Open:
        return "bg-[#f5f2eb] text-zinc-600 border border-[#e3e0d8] dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800";
      case BountyStatus.UnderReview:
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-zinc-900 dark:text-blue-400 dark:border-zinc-800 animate-pulse";
      case BountyStatus.Passed:
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-zinc-900 dark:text-emerald-400 dark:border-zinc-800";
      case BountyStatus.Failed:
        return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-zinc-900 dark:text-rose-400 dark:border-zinc-800";
      case BountyStatus.Disputed:
        return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-zinc-900 dark:text-amber-400 dark:border-zinc-800";
      case BountyStatus.Settled:
        return "bg-zinc-900 text-[#fbf9f6] border border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900";
      default:
        return "";
    }
  };

  // Filtered lists for the history tabs
  const listedBounties = useMemo(() => {
    if (!userAddress) return [];
    return bounties.filter(
      (b) =>
        b.poster.toLowerCase() === userAddress.toLowerCase() &&
        (b.spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toString() === searchQuery)
    );
  }, [bounties, userAddress, searchQuery]);

  const participatedBounties = useMemo(() => {
    if (!userAddress) return [];
    return bounties.filter(
      (b) =>
        b.developer &&
        b.developer.toLowerCase() === userAddress.toLowerCase() &&
        (b.spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toString() === searchQuery)
    );
  }, [bounties, userAddress, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 font-dm-sans">
        {/* Wallet state checks */}
        {!isConnected ? (
          <div className="py-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-clay/20 blur-2xl rounded-full" />
              <div className="relative h-16 w-16 bg-card-bg thin-border rounded-full flex items-center justify-center text-clay shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
            </div>

            <h1 className="font-syne text-3xl font-normal tracking-tight text-foreground mb-4">
              Unlock Your Escrow Dashboard
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">
              Connect your Web3 wallet to access your personalized developer portal, view live AI validation streams, and monitor payouts on the Somnia Testnet.
            </p>

            <div className="p-1 border border-border-color bg-card-bg rounded-md mb-8 w-full max-w-sm">
              <appkit-button balance="show" size="md" label="Connect Wallet" />
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full mt-6 border-t border-border-color pt-8">
              <div>
                <span className="font-mono text-xs text-clay">01</span>
                <h3 className="font-semibold text-sm text-foreground mt-1">Direct Escrows</h3>
                <p className="text-zinc-400 text-xs mt-1 leading-normal">Lock funding safely on-chain using Solidity smart contract protocols.</p>
              </div>
              <div>
                <span className="font-mono text-xs text-clay">02</span>
                <h3 className="font-semibold text-sm text-foreground mt-1">AI Agent Validation</h3>
                <p className="text-zinc-400 text-xs mt-1 leading-normal">Deterministic multi-agent pipeline validates PRs and UI layout diffs instantly.</p>
              </div>
              <div>
                <span className="font-mono text-xs text-clay">03</span>
                <h3 className="font-semibold text-sm text-foreground mt-1">Autonomous Payouts</h3>
                <p className="text-zinc-400 text-xs mt-1 leading-normal">Funds automatically release directly to developers upon verified criteria approval.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Header / Wallet details */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-color pb-6">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-clay">
                  Developer Portal
                </span>
                <h1 className="font-syne text-3xl font-normal leading-tight text-foreground tracking-tight mt-1">
                  Escrow Dashboard
                </h1>
              </div>

              {/* Wallet Info Panel */}
              <div className="flex items-center gap-3 bg-card-bg thin-border px-4 py-2.5 rounded-lg shadow-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs text-zinc-400">Connected:</span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {truncate(userAddress || "")}
                </span>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-foreground"
                  title="Copy full address"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR PANEL */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-lg text-rose-600 text-xs font-mono">
                {error}
              </div>
            )}

            {/* METRICS CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Card 1: Listed */}
              <div className="bg-card-bg thin-border rounded-lg p-5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Listed</span>
                  <Upload className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="mt-4">
                  {loading ? (
                    <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  ) : (
                    <div className="font-serif text-3xl font-medium text-foreground">{stats.listed}</div>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Bounties Posted</span>
                </div>
              </div>

              {/* Card 2: Participated */}
              <div className="bg-card-bg thin-border rounded-lg p-5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Participated</span>
                  <Download className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="mt-4">
                  {loading ? (
                    <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  ) : (
                    <div className="font-serif text-3xl font-medium text-foreground">{stats.participated}</div>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Deliveries Sent</span>
                </div>
              </div>

              {/* Card 3: Spent */}
              <div className="bg-card-bg thin-border rounded-lg p-5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Spent Payouts</span>
                  <Coins className="w-4 h-4 text-clay" />
                </div>
                <div className="mt-4">
                  {loading ? (
                    <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  ) : (
                    <div className="font-serif text-2xl font-semibold text-foreground flex items-baseline gap-1">
                      {stats.spent} <span className="text-xs font-mono font-normal text-zinc-500">SOMI</span>
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Released to Devs</span>
                </div>
              </div>

              {/* Card 4: Locked */}
              <div className="bg-card-bg thin-border rounded-lg p-5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Locked Funds</span>
                  <Lock className="w-4 h-4 text-[#58a0b4]" />
                </div>
                <div className="mt-4">
                  {loading ? (
                    <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  ) : (
                    <div className="font-serif text-2xl font-semibold text-foreground flex items-baseline gap-1">
                      {stats.locked} <span className="text-xs font-mono font-normal text-zinc-500">SOMI</span>
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Active In Escrow</span>
                </div>
              </div>

              {/* Card 5: Received */}
              <div className="bg-card-bg thin-border rounded-lg p-5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Earned Payouts</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-4">
                  {loading ? (
                    <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  ) : (
                    <div className="font-serif text-2xl font-semibold text-foreground flex items-baseline gap-1">
                      {stats.received} <span className="text-xs font-mono font-normal text-zinc-500">SOMI</span>
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Earned as Dev</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR & SEARCH */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-background">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-card-bg thin-border rounded-md w-full md:w-auto overflow-x-auto">
                <button
                  onClick={() => setActiveTab("listed")}
                  className={`px-4 py-2 text-xs font-medium rounded capitalize transition-all whitespace-nowrap ${
                    activeTab === "listed"
                      ? "bg-foreground shadow-sm text-background thin-border"
                      : "text-zinc-500 hover:text-foreground"
                  }`}
                >
                  Listed Escrows ({listedBounties.length})
                </button>
                <button
                  onClick={() => setActiveTab("participated")}
                  className={`px-4 py-2 text-xs font-medium rounded capitalize transition-all whitespace-nowrap ${
                    activeTab === "participated"
                      ? "bg-foreground shadow-sm text-background thin-border"
                      : "text-zinc-500 hover:text-foreground"
                  }`}
                >
                  Participated Works ({participatedBounties.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search agreements by Spec, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-card-bg border rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all"
                />
              </div>
            </div>

            {/* DATA VIEW TABLES */}
            {loading ? (
              <div className="py-20 text-center thin-border rounded-lg bg-card-bg">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-clay border-r-transparent align-[-0.125em]" />
                <p className="text-xs text-zinc-500 mt-3 font-mono">
                  Loading historical transaction ledgers...
                </p>
              </div>
            ) : activeTab === "listed" ? (
              // Listed escrows list
              listedBounties.length === 0 ? (
                <div className="py-16 text-center thin-border rounded-lg bg-card-bg">
                  <p className="text-sm text-zinc-400">No listed escrows found.</p>
                  <Button
                    onClick={() => router.push("/bounty")}
                    className="mt-4 text-xs font-mono uppercase tracking-wider bg-[#191919] hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Post New Escrow
                  </Button>
                </div>
              ) : (
                <div className="bg-card-bg thin-border rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-color text-left text-xs">
                      <thead className="bg-[#fcfbf9] dark:bg-zinc-900/40 text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Specification Requirements</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Reward Amount</th>
                          <th className="px-6 py-4">Date Created</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color font-sans">
                        {listedBounties.map((b) => (
                          <tr key={b.id} className="hover:bg-zinc-500/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-medium text-foreground">#{b.id}</td>
                            <td className="px-6 py-4 max-w-xs sm:max-w-md">
                              <p className="line-clamp-2 text-zinc-600 dark:text-zinc-300 italic">
                                "{b.spec}"
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-[9px] font-mono px-2 py-0.5 rounded tracking-wide uppercase ${getBadgeConfig(
                                  b.status
                                )}`}
                              >
                                {BountyStatus[b.status]}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold text-foreground">
                              <div className="flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5 text-clay" />
                                <span>{b.amount} SOMI</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => router.push(`/bounty/${b.id}`)}
                                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-clay hover:underline"
                              >
                                Details
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              // Participated escrows list
              participatedBounties.length === 0 ? (
                <div className="py-16 text-center thin-border rounded-lg bg-card-bg">
                  <p className="text-sm text-zinc-400">No participated bounties found.</p>
                  <Button
                    onClick={() => router.push("/bounty")}
                    className="mt-4 text-xs font-mono uppercase tracking-wider bg-[#191919] hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Find Work & Deliver
                  </Button>
                </div>
              ) : (
                <div className="bg-card-bg thin-border rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-color text-left text-xs">
                      <thead className="bg-[#fcfbf9] dark:bg-zinc-900/40 text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Specification Requirements</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Reward Amount</th>
                          <th className="px-6 py-4">Date Submitted</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color font-sans">
                        {participatedBounties.map((b) => (
                          <tr key={b.id} className="hover:bg-zinc-500/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-medium text-foreground">#{b.id}</td>
                            <td className="px-6 py-4 max-w-xs sm:max-w-md">
                              <p className="line-clamp-2 text-zinc-600 dark:text-zinc-300 italic">
                                "{b.spec}"
                              </p>
                              {b.prUrl && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono mt-1 hover:text-clay">
                                  PR link: <a href={b.prUrl} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[150px]">{b.prUrl}</a>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-[9px] font-mono px-2 py-0.5 rounded tracking-wide uppercase ${getBadgeConfig(
                                  b.status
                                )}`}
                              >
                                {BountyStatus[b.status]}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold text-foreground">
                              <div className="flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5 text-clay" />
                                <span>{b.amount} SOMI</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono">
                              {b.submittedAt ? new Date(b.submittedAt).toLocaleDateString() : "Pending"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => router.push(`/bounty/${b.id}`)}
                                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-clay hover:underline"
                              >
                                Details
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
