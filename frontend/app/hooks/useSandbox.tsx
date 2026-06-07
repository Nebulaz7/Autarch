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
