# Autarch — Autonomous Bounty Executor

> _The first autonomous on-chain code reviewer that holds money._

Autarch is an agent-native escrow protocol built on Somnia's Agentic L1. It eliminates human reviewers from the bounty lifecycle. When a developer submits work, Autarch autonomously pulls the code, evaluates the implementation against the original spec, and releases funds — all verified by Somnia's validator consensus with no human in the loop.

---

## The Problem

DAOs and Web3 teams post hundreds of thousands of dollars in bounties every month. The bottleneck is never funding — it's **verification**. Human reviewers:

- Take days to review submissions
- Introduce subjective bias into technical evaluations
- Create disputes that stall payments for weeks
- Don't scale with the volume of global contributors

The result: talented developers get paid late, DAOs lose contributors, and the entire open-source economy moves slower than it should.

---

## The Solution

Autarch replaces the human reviewer with a deterministic, validator-verified agent pipeline running natively on Somnia. A bounty poster defines success criteria in plain English. A developer submits a GitHub PR + live preview link. The agent does the rest.

---

## How It Works

```
Bounty Poster                Developer               Autarch Agent Pipeline
     │                           │                           │
     │  1. Fund bounty +         │                           │
     │     define spec           │                           │
     │──────────────────────────►│                           │
     │                           │  2. Submit PR +           │
     │                           │     preview URL           │
     │                           │──────────────────────────►│
     │                           │                    3. JSON API Agent
     │                           │                       fetches GitHub
     │                           │                       PR diff
     │                           │                           │
     │                           │                    4. LLM Parse Website
     │                           │                       scrapes Vercel
     │                           │                       preview
     │                           │                           │
     │                           │                    5. LLM Inference
     │                           │                       evaluates code +
     │                           │                       UI vs spec
     │                           │                           │
     │                           │          ┌────────────────┘
     │                           │          │
     │                           │    Pass? │ Fail / Low confidence?
     │                           │          │
     │                    6a. Auto-release  6b. 24hr dispute window
     │                        funds             → Human arbiter
```

---

## Somnia Agent Pipeline (Technical)

| Step | Somnia Primitive    | What Autarch Does                                                                              |
| ---- | ------------------- | ---------------------------------------------------------------------------------------------- |
| 1    | `JSON API Request`  | Fetches raw GitHub PR diff via GitHub API                                                      |
| 2    | `LLM Parse Website` | Scrapes developer's Vercel preview URL, confirms required UI components render                 |
| 3    | `LLM Inference`     | Runs deterministic evaluation comparing code diff + UI screenshot against original bounty spec |
| 4    | Native Reactivity   | Contract reads consensus result. Pass → release funds. Fail + low confidence → dispute mode    |

---

## Architecture

```
autarch/
├── contracts/                        # Solidity smart contracts
│   ├── interfaces/
│   │   └── IAgentRequester.sol       # Somnia platform interface
│   ├── Autarch.sol                   # Core escrow + agent pipeline orchestrator
│   ├── AutorchRegistry.sol           # Bounty registry, tracks all active bounties
│   └── AutorchArbiter.sol            # Fallback human arbiter dispute module
│
├── frontend/                         # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                  # Landing / bounty board
│   │   ├── bounty/
│   │   │   ├── [id]/page.tsx         # Individual bounty view
│   │   │   └── create/page.tsx       # Create bounty form
│   │   └── submit/[id]/page.tsx      # Developer submission form
│   ├── components/
│   │   ├── BountyCard.tsx
│   │   ├── AgentPipelineStatus.tsx   # Live pipeline step tracker
│   │   ├── EvaluationResult.tsx
│   │   └── ConnectWallet.tsx
│   ├── lib/
│   │   ├── contracts.ts              # Contract ABIs + addresses
│   │   ├── somnia.ts                 # Somnia chain config
│   │   └── wagmi.ts                  # Wallet connection config
│   └── hooks/
│       ├── useBounty.ts
│       └── usePipelineStatus.ts      # Polls agent request status
│
├── scripts/
│   ├── deploy.ts                     # Hardhat deploy script
│   └── seed.ts                       # Seeds test bounties on testnet
│
├── test/
│   └── Autarch.test.ts
│
├── hardhat.config.ts
├── .env.example
└── README.md
```

---

## Smart Contract Design

### `Autarch.sol` — Core Contract

**State:**

```solidity
struct Bounty {
    uint256 id;
    address poster;
    address developer;
    uint256 amount;
    string spec;           // Plain English success criteria
    string prUrl;          // GitHub PR link
    string previewUrl;     // Vercel preview link
    BountyStatus status;   // Open | UnderReview | Passed | Failed | Disputed
    uint256 requestId;     // Somnia agent request ID
    uint256 createdAt;
    uint256 submittedAt;
}

enum BountyStatus { Open, UnderReview, Passed, Failed, Disputed, Settled }
```

**Key Functions:**

```solidity
function createBounty(string calldata spec) external payable
function submitWork(uint256 bountyId, string calldata prUrl, string calldata previewUrl) external
function handleResponse(uint256 requestId, Response[] memory responses, ...) external  // Somnia callback
function raiseDispute(uint256 bountyId) external                                        // 24hr window
function settleDispute(uint256 bountyId, bool approved) external                        // Arbiter only
```

**Agent Pipeline (inside submitWork):**

1. Encode JSON API payload → fetch GitHub PR diff
2. After callback → encode LLM Parse Website → scrape preview URL
3. After callback → encode LLM Inference → evaluate against spec
4. Final callback → if pass, `transfer(developer, amount)`. If fail + low confidence → dispute mode.

### `AutorchArbiter.sol` — Dispute Module

- Registered arbiter address (can be a multisig or trusted EOA for hackathon)
- Developer has 24 hours post-rejection to call `raiseDispute()`
- Arbiter reviews and calls `settleDispute(bountyId, approved)`
- Emergency safety net — keeps the protocol trustworthy without depending on it

---

## Tech Stack

| Layer           | Technology                             | Why                        |
| --------------- | -------------------------------------- | -------------------------- |
| Smart Contracts | Solidity 0.8.20, Hardhat               | EVM native, fast iteration |
| Agent Interface | Somnia IAgentRequester                 | Native L1 agent calls      |
| Frontend        | Next.js 14 (App Router)                | Fast, deployable on Vercel |
| Wallet          | wagmi v2 + viem                        | Best DX for EVM frontends  |
| Styling         | Tailwind CSS + shadcn/ui               | Ship fast, looks clean     |
| Chain Config    | Somnia Testnet (chainId: 50312)        | Live agent execution       |
| Deployment      | Vercel (frontend), Hardhat (contracts) | Fast CI                    |
| Version Control | GitHub (public repo)                   | Required for submission    |

---

## Environment Variables

```bash
# .env
PRIVATE_KEY=                          # Deployer wallet private key
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312
NEXT_PUBLIC_AUTARCH_ADDRESS=          # Deployed contract address
NEXT_PUBLIC_PLATFORM_ADDRESS=0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776
```

---

## Build Timeline

### Tonight — Midpoint Checkpoint (11:59 PM)

**Goal: Convince judges you know exactly what you're building**

- [ ] Initialize repo, push folder structure
- [ ] Write `Autarch.sol` skeleton — structs, enums, function signatures, no logic yet
- [ ] Write `IAgentRequester.sol` interface
- [ ] Initialize Next.js frontend, push to Vercel (even a landing page counts)
- [ ] Write project description for submission
- [ ] Record Loom walkthrough of architecture (5 mins, screen share this README)
- [ ] Upload CV

---

### Day 2-3 — Core Contract Logic

**Goal: Working contract on testnet**

- [ ] Implement `createBounty()` + `submitWork()`
- [ ] Implement the 3-step Somnia agent pipeline inside `submitWork()`
- [ ] Implement `handleResponse()` callback with status routing
- [ ] Implement `raiseDispute()` + `settleDispute()` in Arbiter
- [ ] Write tests for happy path + dispute path
- [ ] Deploy to Somnia testnet

---

### Day 4-5 — Frontend

**Goal: Product-quality UI that makes judges stop scrolling**

- [ ] Bounty board page — list all active bounties
- [ ] Create bounty form — spec input, fund with STT
- [ ] Bounty detail page — shows spec, status, submitted work
- [ ] Submit work form — PR URL + preview URL inputs
- [ ] **Agent Pipeline Status component** — live step-by-step tracker showing which agent is running (this is your wow moment)
- [ ] Evaluation result display — shows LLM reasoning + pass/fail verdict
- [ ] Connect wallet flow

---

### Day 6 — Polish + Demo Prep

**Goal: Submission-ready**

- [ ] End-to-end test with a real GitHub PR + Vercel preview
- [ ] Record 3-minute demo video
- [ ] Write final submission description
- [ ] Presentation deck (5 slides max)
- [ ] Final deploy check

---

## The Demo Script (3 mins)

1. **0:00** — Show the problem: "DAOs post bounties. Reviewers take days. Payments get stuck."
2. **0:30** — Fund a bounty on Autarch with a plain English spec
3. **1:00** — Submit a GitHub PR + Vercel preview as the developer
4. **1:20** — Watch the Agent Pipeline Status UI update live: JSON API → LLM Parse → LLM Inference
5. **2:00** — Evaluation result appears with LLM reasoning
6. **2:20** — Funds release automatically to developer wallet
7. **2:40** — Show the on-chain receipt: verifiable, auditable, immutable

---

## Somnia Testnet Resources

- RPC: `https://dream-rpc.somnia.network`
- Chain ID: `50312`
- Platform Contract: `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`
- Agent Explorer: https://agents.testnet.somnia.network/
- Faucet: https://testnet.somnia.network/
- Docs: https://docs.somnia.network/agents

---

## Why Autarch Wins

- **Agent-native by design** — all three Somnia primitives used meaningfully, not for show
- **Real problem, real users** — DAOs spend millions on bounties with broken review processes
- **Autonomous performance** — zero human intervention in the happy path
- **Trust boundary** — dispute fallback shows production thinking, not just hackathon hacking
- **Compelling demo** — fund → submit → watch agents think → funds release. That's a 3-minute story.
