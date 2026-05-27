"use client";

import React, { useState } from "react";
import { X, Coins, HelpCircle } from "lucide-react";

interface CreateBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (spec: string, amount: string) => void;
}

export default function CreateBountyModal({ isOpen, onClose, onSubmit }: CreateBountyModalProps) {
  const [spec, setSpec] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!spec.trim()) {
      setError("Specification is required");
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("A valid positive reward amount is required");
      return;
    }

    onSubmit(spec, amount);
    setSpec("");
    setAmount("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background thin-border shadow-2xl rounded-lg w-full max-w-lg overflow-hidden relative transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-card-bg">
          <span className="font-serif text-lg font-medium text-foreground">Create New Escrow</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-zinc-900 dark:border-zinc-800 rounded text-rose-600 text-xs font-mono">
              {error}
            </div>
          )}

          {/* 1. English Specs */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              Agreement Specifications
              <span className="text-[10px] text-zinc-400 capitalize">Plain English Rules</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g., Implement a responsive sidebar with three sub-menus matching the design mockup colors (#191919). The sidebar must collapse correctly on mobile layouts below 768px..."
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              className="w-full p-3 text-sm bg-card-bg thin-border rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all placeholder:text-zinc-400 text-foreground"
            />
            <p className="text-[10px] text-zinc-400 leading-normal flex items-start gap-1">
              <HelpCircle className="w-3 h-3 text-zinc-400 mt-0.5" />
              Be as specific as possible. The autonomous LLM validator agent will use this text directly to inspect your developer's code diffs and visual structures.
            </p>
          </div>

          {/* 2. Amount Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Escrow Payout Reward
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Coins className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="0.25"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-16 py-2.5 text-sm bg-card-bg thin-border rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all text-foreground"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-mono text-zinc-500">
                SOMI
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              These tokens will be locked securely in the escrow smart contract on the Somnia Network and automatically released once all criteria are met.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-card-bg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono uppercase tracking-wider rounded thin-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#191919] hover:bg-zinc-800 text-[#fbf9f6] dark:bg-[#f5f5f5] dark:text-[#141413] dark:hover:bg-zinc-200 text-xs font-mono uppercase tracking-wider rounded transition-colors"
            >
              Lock Funds & Create
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
