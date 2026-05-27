"use client";

import { useState, useEffect } from "react";

export enum BountyStatus {
  Open = 0,
  UnderReview = 1,
  Passed = 2,
  Failed = 3,
  Disputed = 4,
  Settled = 5
}

export enum PipelineStep {
  None = 0,
  FetchingDiff = 1,
  ScrapingPreview = 2,
  Evaluating = 3
}

export interface Bounty {
  id: number;
  poster: string;
  developer: string;
  amount: string; // in ETH / SOMI
  spec: string;
  prUrl: string;
  previewUrl: string;
  status: BountyStatus;
  step: PipelineStep;
  codeDiff: string;
  uiScrape: string;
  logs: string[];
  requestId: number;
  createdAt: number;
  submittedAt: number;
  disputeDeadline: number;
  confidence: number;
}

const INITIAL_BOUNTIES: Bounty[] = [
  {
    id: 1,
    poster: "0x88f713A8d2BF0CFD51f84F3E1cbcef04493547fe",
    developer: "0x7F90632a9FdB6E64B447A531C2D8170D42194a28",
    amount: "0.25",
    spec: "Implement a highly interactive and gorgeous Landing Hero section using Tailwind CSS and Framer Motion in a Next.js environment. No gradients allowed; the design must prioritize absolute visual balance, clean typography (serif headings), and subtle warmth in a light-cream theme.",
    prUrl: "https://github.com/developer/autarch-hero/pull/3",
    previewUrl: "https://autarch-hero-demo.vercel.app",
    status: BountyStatus.Passed,
    step: PipelineStep.Evaluating,
    codeDiff: "diff --git a/components/Hero.tsx b/components/Hero.tsx\nindex a12bc..d34ef 100644\n--- a/components/Hero.tsx\n+++ b/components/Hero.tsx\n@@ -10,6 +10,12 @@ export default function Hero() {\n+  return (\n+    <div className='bg-[#FBF9F6] text-[#191919] font-serif border border-[#E3E0D8] p-12 rounded-lg'>\n+      <h1 className='text-5xl font-normal leading-tight tracking-tight'>Decentralized Escrow</h1>\n+      <p className='font-sans mt-4 text-zinc-600'>AI agent pipeline autonomous verification.</p>\n+    </div>\n+  );",
    uiScrape: "Page Title: Autarch Protocol - Autonomous Hero Component\nDOM Structure Extracted: div -> h1 (Decentralized Escrow), p (AI agent pipeline autonomous verification)\nColor Palette Detected: Background: #FBF9F6, Color: #191919 (Warm light-theme matching spec)",
    logs: [
      "[Somnia L1 API Agent] Connected to GitHub API. Fetching repository diff...",
      "[Somnia L1 API Agent] Git diff fetched successfully. Analyzed 1 modified component: components/Hero.tsx.",
      "[Somnia L1 Browser Agent] Booting headless crawler to inspect https://autarch-hero-demo.vercel.app...",
      "[Somnia L1 Browser Agent] Preview crawled successfully. Verified DOM elements and background colors.",
      "[Somnia L1 Consensus Engine] Evaluating code structure and UI visuals against specifications...",
      "[Consensus Verdict] Evaluation Passed. Match confidence: 94%. Automatic payout released to 0x7F90632a..."
    ],
    requestId: 4012,
    createdAt: Date.now() - 3600000 * 24, // 1 day ago
    submittedAt: Date.now() - 3600000 * 22,
    disputeDeadline: 0,
    confidence: 94
  },
  {
    id: 2,
    poster: "0x3F16fe7E1A23a7c1bF5Eaf038094F4a1e8894455",
    developer: "",
    amount: "0.5",
    spec: "Create an autonomous decentralized file indexer that scrapes metadata from open journals and logs it to a smart contract registry on Somnia Network. Scraper should support multi-threading and failover fallbacks.",
    prUrl: "",
    previewUrl: "",
    status: BountyStatus.Open,
    step: PipelineStep.None,
    codeDiff: "",
    uiScrape: "",
    logs: [],
    requestId: 0,
    createdAt: Date.now() - 3600000 * 5, // 5 hours ago
    submittedAt: 0,
    disputeDeadline: 0,
    confidence: 0
  }
];

export function useSandbox() {
  const [bounties, setBounties] = useState<Bounty[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("autarch_sandbox_bounties");
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_BOUNTIES;
  });

  useEffect(() => {
    localStorage.setItem("autarch_sandbox_bounties", JSON.stringify(bounties));
  }, [bounties]);

  // Create local bounty
  const createBounty = (spec: string, amount: string, posterAddress: string = "0x88f713A8d2BF0CFD51f84F3E1cbcef04493547fe") => {
    const newBounty: Bounty = {
      id: bounties.length + 1,
      poster: posterAddress,
      developer: "",
      amount,
      spec,
      prUrl: "",
      previewUrl: "",
      status: BountyStatus.Open,
      step: PipelineStep.None,
      codeDiff: "",
      uiScrape: "",
      logs: [],
      requestId: 0,
      createdAt: Date.now(),
      submittedAt: 0,
      disputeDeadline: 0,
      confidence: 0
    };
    setBounties(prev => [newBounty, ...prev]);
    return newBounty.id;
  };

  // Submit work and trigger simulated Somnia AI agent pipeline runs!
  const submitWork = (bountyId: number, prUrl: string, previewUrl: string, devAddress: string = "0x7F90632a9FdB6E64B447A531C2D8170D42194a28") => {
    setBounties(prev => prev.map(b => {
      if (b.id === bountyId) {
        return {
          ...b,
          developer: devAddress,
          prUrl,
          previewUrl,
          status: BountyStatus.UnderReview,
          step: PipelineStep.FetchingDiff,
          submittedAt: Date.now(),
          logs: ["[Somnia L1 API Agent] Connecting to GitHub API... Initializing checkout."]
        };
      }
      return b;
    }));

    // Trigger AI pipeline steps
    simulatePipeline(bountyId);
  };

  const simulatePipeline = (bountyId: number) => {
    // Step 1: FetchingDiff (After 2s)
    setTimeout(() => {
      setBounties(prev => prev.map(b => {
        if (b.id === bountyId) {
          return {
            ...b,
            step: PipelineStep.ScrapingPreview,
            codeDiff: "diff --git a/index.js b/index.js\nindex c2f19..d44e5 100644\n--- a/index.js\n+++ b/index.js\n@@ -1,5 +1,10 @@\n-console.log('old');\n+const indexer = {\n+  scrape: async (journal) => {\n+    const meta = await fetchMetadata(journal);\n+    await logToRegistry(meta);\n+  }\n+};",
            logs: [
              ...b.logs,
              "[Somnia L1 API Agent] Git diff fetched successfully. Analyzed 1 modified file: index.js.",
              "[Somnia L1 Browser Agent] Booting headless crawler to inspect visual interface..."
            ]
          };
        }
        return b;
      }));
    }, 2500);

    // Step 2: ScrapingPreview (After 5s)
    setTimeout(() => {
      setBounties(prev => prev.map(b => {
        if (b.id === bountyId) {
          return {
            ...b,
            step: PipelineStep.Evaluating,
            uiScrape: "Scraped Visual DOM elements from Preview Link:\n- Header Component rendered correctly.\n- File logs list populated with metadata from open journals.\n- Multi-threading tests successful under active loads.",
            logs: [
              ...b.logs,
              "[Somnia L1 Browser Agent] Scraper run complete. Found active file lists and scraper hooks.",
              "[Somnia L1 Consensus Engine] Evaluating code logs and visual output against initial specifications..."
            ]
          };
        }
        return b;
      }));
    }, 5000);

    // Step 3: Evaluation Verdict (After 8s)
    setTimeout(() => {
      setBounties(prev => prev.map(b => {
        if (b.id === bountyId) {
          // Let's make it pass if the spec is simple or randomly, let's default to pass for awesome demo!
          const pass = !b.spec.toLowerCase().includes("fail");
          const confidence = pass ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 20) + 50;

          if (pass) {
            return {
              ...b,
              status: BountyStatus.Passed,
              confidence,
              logs: [
                ...b.logs,
                `[Consensus Verdict] Evaluation Passed. Spec coverage checks match successfully. Match confidence: ${confidence}%.`,
                `[Somnia Contract] Releasing locked amount of ${b.amount} ETH/SOMI to developer: ${b.developer}.`,
                "[Transaction Complete] Funds released successfully."
              ]
            };
          } else {
            return {
              ...b,
              status: BountyStatus.Failed,
              confidence,
              disputeDeadline: Date.now() + 3600000 * 24, // 24 hours
              logs: [
                ...b.logs,
                `[Consensus Verdict] Evaluation Failed. Specs do not match implementation. Confidence score: ${confidence}% (Threshold: 80%).`,
                `[Somnia Contract] Escrow status updated to Failed. Developer has 24 hours to raise a dispute.`,
                `[System Warning] Locked payout amount remains in escrow pending human arbiter review.`
              ]
            };
          }
        }
        return b;
      }));
    }, 7500);
  };

  // Raise dispute
  const raiseDispute = (bountyId: number) => {
    setBounties(prev => prev.map(b => {
      if (b.id === bountyId) {
        return {
          ...b,
          status: BountyStatus.Disputed,
          logs: [
            ...b.logs,
            `[Dispute Raised] Developer has raised a formal dispute to contest the AI pipeline's verdict.`,
            `[Arbiter System] Human Arbiter fallback has been notified. Pending settlement decision.`
          ]
        };
      }
      return b;
    }));
  };

  // Settle dispute
  const settleDispute = (bountyId: number, approved: boolean) => {
    setBounties(prev => prev.map(b => {
      if (b.id === bountyId) {
        const text = approved 
          ? `[Dispute Settled] Human Arbiter has overridden the AI verdict. Released ${b.amount} ETH/SOMI to developer.`
          : `[Dispute Rejected] Human Arbiter has upheld the AI verdict. Refunded locked amount to poster: ${b.poster}.`;

        return {
          ...b,
          status: BountyStatus.Settled,
          logs: [
            ...b.logs,
            text,
            `[Transaction Closed] Escrow finalized.`
          ]
        };
      }
      return b;
    }));
  };

  return {
    bounties,
    createBounty,
    submitWork,
    raiseDispute,
    settleDispute
  };
}
