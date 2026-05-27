"use client";

import React, { useState } from "react";
import { Bounty, BountyStatus } from "../hooks/useSandbox";
import { Search, Filter, Coins, ArrowRight } from "lucide-react";

interface BountyListProps {
  bounties: Bounty[];
  onSelectBounty: (bounty: Bounty) => void;
}

type FilterType = "all" | "open" | "under_review" | "resolved" | "disputed";

export default function BountyList({ bounties, onSelectBounty }: BountyListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusConfig = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.Open:
        return {
          label: "Open",
          classes: "bg-[#f5f2eb] text-zinc-600 border border-[#e3e0d8] dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
        };
      case BountyStatus.UnderReview:
        return {
          label: "Under Review",
          classes: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-zinc-900 dark:text-blue-400 dark:border-zinc-800",
        };
      case BountyStatus.Passed:
        return {
          label: "Passed",
          classes: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-zinc-900 dark:text-emerald-400 dark:border-zinc-800",
        };
      case BountyStatus.Failed:
        return {
          label: "Failed",
          classes: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-zinc-900 dark:text-rose-400 dark:border-zinc-800",
        };
      case BountyStatus.Disputed:
        return {
          label: "Disputed",
          classes: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-zinc-900 dark:text-amber-400 dark:border-zinc-800",
        };
      case BountyStatus.Settled:
        return {
          label: "Settled",
          classes: "bg-zinc-900 text-[#fbf9f6] border border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900",
        };
    }
  };

  const filteredBounties = bounties.filter((b) => {
    // Apply search filter
    const matchesSearch = b.spec.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.id.toString() === searchQuery ||
                          b.poster.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.developer && b.developer.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Apply status filter
    if (activeFilter === "open") return b.status === BountyStatus.Open;
    if (activeFilter === "under_review") return b.status === BountyStatus.UnderReview;
    if (activeFilter === "resolved") return b.status === BountyStatus.Passed || b.status === BountyStatus.Settled;
    if (activeFilter === "disputed") return b.status === BountyStatus.Disputed || b.status === BountyStatus.Failed;
    
    return true;
  });

  const truncateAddress = (addr: string) => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-background py-8 transition-colors duration-300">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-card-bg thin-border rounded-md">
          {(["all", "open", "under_review", "resolved", "disputed"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded capitalize whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-background shadow-sm text-foreground thin-border"
                  : "text-zinc-500 hover:text-foreground"
              }`}
            >
              {filter.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search spec, address, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card-bg thin-border rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all"
          />
        </div>
      </div>

      {/* Grid of cards */}
      {filteredBounties.length === 0 ? (
        <div className="py-20 text-center thin-border rounded-lg bg-card-bg">
          <p className="text-sm text-zinc-400 font-sans">No escrows found matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBounties.map((bounty) => {
            const statusCfg = getStatusConfig(bounty.status);
            return (
              <div
                key={bounty.id}
                onClick={() => onSelectBounty(bounty)}
                className="bg-card-bg thin-border rounded-lg p-6 flex flex-col justify-between h-[300px] cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs text-zinc-400">
                      Escrow #{bounty.id}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded tracking-wide uppercase ${statusCfg.classes}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Specification */}
                  <p className="font-serif text-lg font-normal leading-snug text-foreground line-clamp-3 mb-6">
                    {bounty.spec}
                  </p>
                </div>

                {/* Bottom Stats */}
                <div className="pt-4 border-t border-border-color flex justify-between items-end">
                  {/* Addresses */}
                  <div className="grid grid-cols-2 gap-4 text-[11px] font-mono text-zinc-500">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-zinc-400">Poster</span>
                      <span>{truncateAddress(bounty.poster)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-zinc-400">Developer</span>
                      <span>{truncateAddress(bounty.developer)}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-1.5 text-right">
                    <div className="text-zinc-500 font-mono text-[9px] uppercase mr-1">Locked Reward</div>
                    <Coins className="w-4 h-4 text-clay" />
                    <span className="font-serif text-2xl font-normal text-foreground leading-none">
                      {bounty.amount}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 leading-none">SOMI</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
