"use client";

import React from "react";
import { GitPullRequest, Eye, FileCheck, ShieldAlert } from "lucide-react";

export default function About() {
  const steps = [
    {
      icon: <GitPullRequest className="w-5 h-5 text-clay" />,
      step: "01",
      title: "Fetch Git Diff",
      agent: "JSON API Agent",
      description:
        "The developer submits a GitHub Pull Request. Our on-chain JSON API agent fetches the raw code diff, isolating modified code structures and logic updates in consensus-verified logs."
    },
    {
      icon: <Eye className="w-5 h-5 text-clay" />,
      step: "02",
      title: "Scrape Visual Layout",
      agent: "LLM Parse Agent",
      description:
        "A headless DOM browser agent inspects the visual output of the live preview deployment URL, extracting styling rules, visual components, layout structures, and DOM trees."
    },
    {
      icon: <FileCheck className="w-5 h-5 text-clay" />,
      step: "03",
      title: "Consensus Evaluation",
      agent: "LLM Inference Agent",
      description:
        "A highly-calibrated LLM evaluator compares the isolated git diff and scraped DOM state directly against the English specifications. Payout triggers automatically on 80%+ confidence."
    }
  ];

  return (
    <section className="py-20 border-t border-border-color bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Title */}
        <div className="max-w-xl mb-16">
          <span className="text-xs uppercase font-mono tracking-wider text-clay">The Autonomous Pipeline</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight text-foreground tracking-tight mt-2">
            How Autarch executes secure on-chain payouts
          </h2>
          <p className="font-sans text-sm text-zinc-500 mt-4 leading-relaxed">
            By combining decentralized smart contracts on Somnia Network with consensus-backed web crawlers and LLM analysis, payouts require no human overhead, keeping agreements secure and rapid.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => (
            <div key={idx} className="p-8 bg-card-bg thin-border rounded-lg relative flex flex-col justify-between h-96 group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div className="p-2 rounded bg-background border border-border-color">
                    {item.icon}
                  </div>
                  <span className="font-mono text-3xl font-light text-zinc-300 dark:text-zinc-700">
                    {item.step}
                  </span>
                </div>

                {/* Content */}
                <span className="text-[10px] font-mono uppercase bg-[#191919] text-[#FBF9F6] dark:bg-[#F5F5F5] dark:text-[#141413] px-2 py-0.5 rounded tracking-wider">
                  {item.agent}
                </span>
                <h3 className="font-serif text-xl font-medium text-foreground mt-4 mb-2">
                  {item.title}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-zinc-500">
                  {item.description}
                </p>
              </div>

              {/* Step indicator */}
              <div className="h-0.5 w-full bg-border-color mt-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-0 bg-clay group-hover:w-full transition-all duration-700 ease-out" />
              </div>
            </div>
          ))}
        </div>

        {/* Arbiter Fallback Callout */}
        <div className="mt-12 p-6 rounded-lg border border-[#e8dcc4] bg-[#fdfaf2] dark:border-zinc-800 dark:bg-zinc-950 flex flex-col sm:flex-row items-start gap-4">
          <div className="p-2 rounded bg-amber-100 text-amber-800 dark:bg-zinc-900 dark:text-amber-500 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Human-in-the-Loop Arbiter Override</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              If an AI evaluation returns a Fail verdict, developers can instantly trigger a formal dispute within a 24-hour window. This pauses finalization and alerts the designated human Arbiter (EVM multisig fallback) to manually review visual logs and override payouts as needed.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
