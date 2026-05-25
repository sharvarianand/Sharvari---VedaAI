/* -----------------------------------------------------------------
 * Shared assignment domain types.
 * These mirror the future backend contract so the same shapes can
 * be reused on the API once Express is wired up.
 * ---------------------------------------------------------------*/

export type Difficulty = "easy" | "moderate" | "hard";

export type QuestionTypeKey =
  | "mcq"
  | "short"
  | "long"
  | "diagram"
  | "numerical"
  | "true-false"
  | "fill-blanks";

export interface QuestionTypeConfig {
  /** Stable id so React keys survive reordering. */
  id: string;
  type: QuestionTypeKey;
  count: number;
  marksPerQuestion: number;
}

export interface UploadedFileMeta {
  name: string;
  size: number;
  type: string;
}

export interface AssignmentDraft {
  title: string;
  file: UploadedFileMeta | null;
  dueDate: string; // ISO yyyy-mm-dd
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  /** Optional branding — sent to API when set. */
  schoolName?: string;
  subject?: string;
  className?: string;
}

export type PaperVersionSource = "ai" | "manual";

export type AssignmentStatus = "draft" | "queued" | "generating" | "ready" | "failed";

export interface Question {
  id: string;
  text: string;
  difficulty: Difficulty;
  marks: number;
}

export interface Section {
  id: string;
  title: string; // e.g. "Section A"
  heading: string; // e.g. "Short Answer Questions"
  instruction: string; // e.g. "Attempt all questions. Each question carries 2 marks"
  questions: Question[];
}

export interface QuestionPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowedMinutes: number;
  maximumMarks: number;
  sections: Section[];
  answerKey: { questionId: string; answer: string }[];
}

export interface PaperVersion {
  version: number;
  title: string;
  source: PaperVersionSource;
  note?: string;
  paper: QuestionPaper;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  assignedOn: string; // ISO date
  dueOn: string; // ISO date
  status: AssignmentStatus;
  draft: AssignmentDraft;
  paper?: QuestionPaper;
  currentVersion: number;
  paperVersions: PaperVersion[];
  error?: string;
}

export interface GenerationProgress {
  percent: number;
  stage: string;
}
