"use client";

import React, { useState } from "react";
import { X, GitPullRequest, Eye, HelpCircle } from "lucide-react";

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prUrl: string, previewUrl: string) => void;
}

export default function SubmitWorkModal({ isOpen, onClose, onSubmit }: SubmitWorkModalProps) {
  const [prUrl, setPrUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!prUrl.trim() || !prUrl.includes("github.com")) {
      setError("A valid GitHub Pull Request URL is required");
      return;
    }

    if (!previewUrl.trim() || (!previewUrl.startsWith("http://") && !previewUrl.startsWith("https://"))) {
      setError("A valid live preview URL starting with http:// or https:// is required");
      return;
    }

    onSubmit(prUrl, previewUrl);
    setPrUrl("");
    setPreviewUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background thin-border shadow-2xl rounded-lg w-full max-w-lg overflow-hidden relative transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-card-bg">
          <span className="font-serif text-lg font-medium text-foreground">Submit Work Delivery</span>
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
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-card-bg thin-border rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all text-foreground"
              />
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              The git code diff of the changes will be fetched by the Somnia API Agent.
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
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-card-bg thin-border rounded-md focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all text-foreground"
              />
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              The live interface layout of the deployment will be fetched by the Somnia Headless Crawler.
            </p>
          </div>

          {/* Warning / Instruction */}
          <div className="p-4 rounded border border-[#e8dcc4] bg-[#fdfaf2] dark:border-zinc-800 dark:bg-zinc-950 flex gap-3 text-[11px] text-zinc-500 leading-relaxed">
            <HelpCircle className="w-6 h-6 text-[#d97757] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Triggering AI Pipelines:</span> After submitting, the smart contract automatically schedules the 3-step AI agent verification flow. This in-memory evaluation takes ~8 seconds to simulate and logs real-time console consensus checks.
            </div>
          </div>

          {/* Submit Buttons */}
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
              Submit Work & Verify
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
