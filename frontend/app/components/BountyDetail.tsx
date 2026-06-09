"use client";

import React, { useState, useEffect } from "react";
import { Bounty, BountyStatus, PipelineStep } from "../hooks/useSandbox";
import {
  Coins,
  GitBranch,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BountyDetailProps {
  bounty: Bounty;
  userAddress: string;
  onBack: () => void;
  onSubmitWork: (bountyId: number) => void;
  onRaiseDispute: (bountyId: number) => void;
  onSettleDispute: (bountyId: number, approved: boolean) => void;
}

export default function BountyDetail({
  bounty,
  userAddress,
  onBack,
  onSubmitWork,
  onRaiseDispute,
  onSettleDispute,
}: BountyDetailProps) {
  const [activeTab, setActiveTab] = useState<"spec" | "pipeline" | "diffs">(
    "spec",
  );
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (bounty.status !== BountyStatus.Failed || bounty.disputeDeadline === 0)
      return;

    const interval = setInterval(() => {
      const diff = bounty.disputeDeadline - Date.now();
      if (diff <= 0) {
        setTimeLeft("Window Expired");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bounty]);

  const truncateAddress = (addr: string) => {
    if (!addr) return "—";
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getStatusLabel = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.Open:
        return "Open for Submissions";
      case BountyStatus.UnderReview:
        return "Somnia AI Review Active";
      case BountyStatus.Passed:
        return "Completed (AI Passed)";
      case BountyStatus.Failed:
        return "Escrow Paused (AI Failed)";
      case BountyStatus.Disputed:
        return "Formal Dispute Raised";
      case BountyStatus.Settled:
        return "Finalized by Arbiter";
    }
  };

  const isDeveloper =
    bounty.developer.toLowerCase() === userAddress.toLowerCase();
  const isPoster = bounty.poster.toLowerCase() === userAddress.toLowerCase();

  return (
    <div className="bg-background py-6 transition-colors duration-300">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 hover:text-foreground mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Bounties
      </button>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Escrow Specifications & Diffs (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header Card */}
          <div className="p-8 bg-card-bg thin-border rounded-lg">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <span className="font-mono text-xs text-zinc-400">
                Escrow Contract #{bounty.id}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 tracking-wide uppercase bg-clay text-background">
                {getStatusLabel(bounty.status)}
              </span>
            </div>

            <h1 className="font-syne text-2xl sm:text-3xl font-normal leading-tight text-foreground tracking-tight mb-4">
              Escrow Bounty Specification
            </h1>

            {/* Tab Links */}
            <div className="flex border-b border-border-color gap-6 mt-8">
              <button
                onClick={() => setActiveTab("spec")}
                className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                  activeTab === "spec"
                    ? "border-b border-clay text-foreground font-semibold"
                    : "text-zinc-400 hover:text-foreground"
                }`}
              >
                1. English Requirements
              </button>
              {bounty.status !== BountyStatus.Open && (
                <>
                  <button
                    onClick={() => setActiveTab("pipeline")}
                    className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      activeTab === "pipeline"
                        ? "border-b border-clay text-foreground font-semibold"
                        : "text-zinc-400 hover:text-foreground"
                    }`}
                  >
                    2. AI Execution Console
                  </button>
                  <button
                    onClick={() => setActiveTab("diffs")}
                    className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      activeTab === "diffs"
                        ? "border-b border-clay text-foreground font-semibold"
                        : "text-zinc-400 hover:text-foreground"
                    }`}
                  >
                    3. Isolated Artifacts
                  </button>
                </>
              )}
            </div>

            {/* Tab Contents */}
            <div className="py-6">
              {activeTab === "spec" && (
                <div className="prose prose-sm dark:prose-invert">
                  <p className="font-serif text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line italic">
                    "{bounty.spec}"
                  </p>
                </div>
              )}

              {activeTab === "pipeline" && (
                <div className="flex flex-col gap-4">
                  {/* Pipeline Stepper Header */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono uppercase tracking-wider mb-4 border-b border-border-color pb-4">
                    <div
                      className={`p-2 rounded ${bounty.step >= PipelineStep.FetchingDiff ? "bg-amber-50 text-amber-800 dark:bg-zinc-900 dark:text-amber-500 border border-amber-200 dark:border-zinc-800" : "text-zinc-400"}`}
                    >
                      01. JSON API Diff
                    </div>
                    <div
                      className={`p-2 rounded ${bounty.step >= PipelineStep.ScrapingPreview ? "bg-amber-50 text-amber-800 dark:bg-zinc-900 dark:text-amber-500 border border-amber-200 dark:border-zinc-800" : "text-zinc-400"}`}
                    >
                      02. Headless DOM Scrape
                    </div>
                    <div
                      className={`p-2 rounded ${bounty.step >= PipelineStep.Evaluating ? "bg-amber-50 text-amber-800 dark:bg-zinc-900 dark:text-amber-500 border border-amber-200 dark:border-zinc-800" : "text-zinc-400"}`}
                    >
                      03. Verdict Consensus
                    </div>
                  </div>

                  {/* Terminal Logger Screen */}
                  <div className="bg-zinc-950 text-zinc-300 p-6 rounded-lg font-mono text-xs flex flex-col gap-2 shadow-inner border border-zinc-800">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500">
                          SOMNIA AGENT EXECUTOR // REQ_
                          {bounty.requestId || "NULL"}
                        </span>
                      </div>
                      {bounty.status === BountyStatus.UnderReview && (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>RUNNING...</span>
                        </div>
                      )}
                    </div>

                    {bounty.logs.length === 0 ? (
                      <p className="text-zinc-600">
                        No agent activities logged yet.
                      </p>
                    ) : (
                      bounty.logs.map((log, index) => (
                        <p
                          key={index}
                          className={
                            log.includes("Passed")
                              ? "text-emerald-500 font-semibold"
                              : log.includes("Failed")
                                ? "text-rose-500 font-semibold"
                                : "text-zinc-400"
                          }
                        >
                          <span className="text-zinc-600 mr-2">&gt;&gt;</span>
                          {log}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "diffs" && (
                <div className="flex flex-col gap-6">
                  {/* Code Diff Display */}
                  {bounty.codeDiff && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        Isolated Git Patch Diff
                      </h4>
                      <pre className="bg-zinc-950 text-[#F5F5F5] border border-zinc-800 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                        <code>{bounty.codeDiff}</code>
                      </pre>
                    </div>
                  )}

                  {/* DOM Scrape Display */}
                  {bounty.uiScrape && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xs font-mono uppercase text-zinc-400">
                        Scraped DOM Layout Hierarchy
                      </h4>
                      <pre className="bg-zinc-950 text-[#F5F5F5] border border-zinc-800 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        <code>{bounty.uiScrape}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Boxes / Notifications based on state */}

          {/* 1. Failed State Dispute Panel */}
          {bounty.status === BountyStatus.Failed && (
            <div className="p-8 border border-rose-200 bg-rose-50 dark:border-zinc-800 dark:bg-zinc-950 rounded-lg flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-100 text-rose-800 dark:bg-zinc-900 dark:text-rose-500 rounded mt-0.5">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    AI Consensus Evaluation: FAILED
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-lg leading-relaxed">
                    The Somnia validator agents evaluated the changes against
                    specifications and logged a failed consensus with{" "}
                    <span className="font-semibold text-rose-600">
                      {bounty.confidence}%
                    </span>{" "}
                    confidence score. Payout is paused.
                  </p>
                  <div className="mt-4 flex items-center gap-2 font-mono text-xs text-rose-600 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-zinc-800 px-3 py-1 rounded w-fit">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                    {timeLeft}
                  </div>
                </div>
              </div>

              {isDeveloper && (
                <button
                  onClick={() => onRaiseDispute(bounty.id)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-[#fbf9f6] text-xs font-mono uppercase tracking-wider rounded transition-colors self-end sm:self-center whitespace-nowrap"
                >
                  Raise Dispute
                </button>
              )}
            </div>
          )}

          {/* 2. Dispute Settle Panel for Arbiter */}
          {bounty.status === BountyStatus.Disputed && (
            <div className="p-8 border border-amber-200 bg-amber-50 dark:border-zinc-800 dark:bg-zinc-950 rounded-lg">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 text-amber-800 dark:bg-zinc-900 dark:text-amber-500 rounded mt-0.5">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Escrow in Disputed State
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-lg leading-relaxed">
                      Developer has raised a formal dispute. Autarch smart
                      contract awaits a decision from the trusted human Arbiter
                      wrapper.
                    </p>
                  </div>
                </div>

                {/* Settle controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => onSettleDispute(bounty.id, true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-[#fbf9f6] text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap"
                  >
                    Approve Payout (Override AI Fail)
                  </button>
                  <button
                    onClick={() => onSettleDispute(bounty.id, false)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-[#fbf9f6] text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap"
                  >
                    Refund Creator (Confirm AI Fail)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Passed / Settled Finality Panel */}
          {(bounty.status === BountyStatus.Passed ||
            bounty.status === BountyStatus.Settled) && (
            <div className="p-8 border border-emerald-200 bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-950 rounded-lg flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-zinc-900 dark:text-emerald-500 rounded mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Escrow Finalized & Funds Released
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-2xl">
                  This transaction is fully closed and finalized. The locked
                  reward of{" "}
                  <span className="font-semibold">{bounty.amount} SOMI</span>{" "}
                  has been transferred to developer:{" "}
                  <span className="font-mono text-xs underline">
                    {truncateAddress(bounty.developer)}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Escrow Metadata Ledger & Submissions (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Metadata Ledger Card */}
          <div className="p-6 bg-card-bg thin-border rounded-lg">
            <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-400 mb-6">
              Escrow Ledger
            </h3>

            <div className="flex flex-col gap-4 font-sans text-xs">
              {/* Creator */}
              <div className="flex justify-between items-center py-2 border-b border-border-color">
                <span className="text-zinc-400">Escrow Poster</span>
                <span className="font-mono text-foreground font-medium">
                  {truncateAddress(bounty.poster)}
                </span>
              </div>

              {/* Developer */}
              <div className="flex justify-between items-center py-2 border-b border-border-color">
                <span className="text-zinc-400">Developer</span>
                <span className="font-mono text-foreground font-medium">
                  {truncateAddress(bounty.developer)}
                </span>
              </div>

              {/* Locked Value */}
              <div className="flex justify-between items-center py-2 border-b border-border-color">
                <span className="text-zinc-400">Locked Value</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-clay" />
                  <span className="font-mono text-foreground font-semibold">
                    {bounty.amount} SOMI
                  </span>
                </div>
              </div>

              {/* Created At */}
              <div className="flex justify-between items-center py-2 border-b border-border-color">
                <span className="text-zinc-400">Opened Date</span>
                <span className="font-mono text-foreground">
                  {new Date(bounty.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Submission Date */}
              {bounty.submittedAt !== 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border-color">
                  <span className="text-zinc-400">Submitted Date</span>
                  <span className="font-mono text-foreground">
                    {new Date(bounty.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Arbiter Address */}
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400">Human Arbiter</span>
                <span className="font-mono text-foreground font-medium">
                  {truncateAddress(
                    process.env.NEXT_PUBLIC_ARBITER_ADDRESS || "0x2092ea9023EdAD0ada446C1B6B8162d798876EfF"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Submissions Panel */}
          {bounty.status === BountyStatus.Open && (
            <div className="p-6 bg-background border border-foreground rounded-lg text-center flex flex-col gap-4 items-center justify-center py-8">
              <Coins className="w-8 h-8 text-clay" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Ready to Submit Work?
                </h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed px-4">
                  Pastes your GitHub Pull Request URL and a live deployment
                  preview to trigger our automated AI verification pipeline.
                </p>
              </div>
              <Button
                onClick={() => onSubmitWork(bounty.id)}
                className="hover:text-black transition hidden lg:block"
              >
                Submit Delivery
              </Button>
            </div>
          )}

          {/* Submitted Links Summary */}
          {bounty.status !== BountyStatus.Open && (
            <div className="p-6 bg-card-bg thin-border rounded-lg">
              <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-400 mb-6">
                Delivery Artifacts
              </h3>
              <div className="flex flex-col gap-4 font-sans text-xs">
                <div>
                  <span className="block text-zinc-400 mb-1">
                    GitHub Pull Request
                  </span>
                  <a
                    href={bounty.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-clay break-all hover:underline"
                  >
                    {bounty.prUrl}
                  </a>
                </div>
                <div>
                  <span className="block text-zinc-400 mb-1">
                    Live Preview Deployment
                  </span>
                  <a
                    href={bounty.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-clay break-all hover:underline"
                  >
                    {bounty.previewUrl}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
