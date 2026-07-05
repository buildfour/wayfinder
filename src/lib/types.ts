export type StepType = "instruction" | "branch" | "checkpoint";

export type StuckReason = "mismatch" | "confused" | "alreadyDone";

export interface BranchOption {
  id: string;
  label: string;
  description: string;
  cta: string;
  accent: "cobalt" | "amber";
}

export interface SourcePassage {
  text: string;
  highlight?: string;
  attribution: string;
  section: string;
  url?: string;
}

export interface StuckHelpContent {
  message: string;
  quote?: string;
}

export interface TourStep {
  id: string;
  type: StepType;
  chapter?: string;
  headline: string;
  body: string;
  /** If set, step only appears when this branch is selected */
  branchId?: string;
  sourcePassage?: SourcePassage;
  branchOptions?: BranchOption[];
  checkpointPrompt?: string;
  checkpointYes?: string;
  checkpointNo?: string;
  checkpointDiagnostic?: string;
  stuckHelp?: Partial<Record<StuckReason, StuckHelpContent>>;
  previewTitle?: string;
  previewDescription?: string;
  /** Position on source minimap (0–1) */
  sourceAnchor?: number;
}

export interface Tour {
  id: string;
  title: string;
  sourceTitle: string;
  sourceUrl?: string;
  goal: string;
  estimatedMinutes: number;
  branchCount: number;
  steps: TourStep[];
  lastSynced?: string;
  createdAt: string;
  /** Full ingested source text for quoting and future AI extraction */
  sourceText?: string;
  sourceExcerpt?: string;
}

export interface ResolvedTourStep extends TourStep {
  number: number;
}

export interface SavedTourMeta {
  id: string;
  title: string;
  source: string;
  goal: string;
  stepCount: number;
  progress: number;
  lastVisitedStep: number;
  updatedAt: string;
}

export interface TourProgress {
  tourId: string;
  currentStepIndex: number;
  completedStepIds: string[];
  selectedBranch: string | null;
  startTime: number;
  elapsedMinutes: number;
  updatedAt?: string;
}

export interface TourSettings {
  showCheckpoints: boolean;
  autoBranchByOS: boolean;
  showTimeEstimates: boolean;
  notifyOnSourceChange: boolean;
}

export interface PreviewFrame {
  number: string;
  title: string;
  description: string;
  chapter: string;
  hasBranch?: boolean;
  hasCheckpoint?: boolean;
  stepId: string;
}
