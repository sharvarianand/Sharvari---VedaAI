import { z } from "zod";

/* -----------------------------------------------------------------
 * Public domain schemas
 * These shapes match the frontend's `types/assignment.ts` so a single
 * payload travels end-to-end without remapping.
 * ---------------------------------------------------------------*/

export const DifficultySchema = z.enum(["easy", "moderate", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const QuestionTypeKeySchema = z.enum([
  "mcq",
  "short",
  "long",
  "diagram",
  "numerical",
  "true-false",
  "fill-blanks",
]);
export type QuestionTypeKey = z.infer<typeof QuestionTypeKeySchema>;

export const QuestionTypeConfigSchema = z.object({
  type: QuestionTypeKeySchema,
  count: z.number().int().min(1).max(100),
  marksPerQuestion: z.number().int().min(1).max(100),
});
export type QuestionTypeConfig = z.infer<typeof QuestionTypeConfigSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  difficulty: DifficultySchema,
  marks: z.number().int().min(1).max(100),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  heading: z.string(),
  instruction: z.string(),
  questions: z.array(QuestionSchema).min(1),
});
export type Section = z.infer<typeof SectionSchema>;

export const QuestionPaperSchema = z.object({
  schoolName: z.string(),
  subject: z.string(),
  className: z.string(),
  timeAllowedMinutes: z.number().int().min(5).max(360),
  maximumMarks: z.number().int().min(1).max(1000),
  sections: z.array(SectionSchema).min(1),
  answerKey: z.array(
    z.object({ questionId: z.string(), answer: z.string() })
  ),
});
export type QuestionPaper = z.infer<typeof QuestionPaperSchema>;

/* -----------------------------------------------------------------
 * Inputs accepted by the generator
 * ---------------------------------------------------------------*/

export interface UploadedMaterial {
  name: string;
  size: number;
  mime: string;
  extractedText?: string;
}

export interface GenerationInput {
  /** Optional context file metadata. Contents are not parsed in v1. */
  material?: UploadedMaterial;
  dueDate: string; // ISO yyyy-mm-dd
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  regenerationInstructions?: string;
  /** Light branding details so the rendered paper looks finished. */
  schoolName: string;
  subject: string;
  className: string;
}

/* -----------------------------------------------------------------
 * Adapter contract
 * ---------------------------------------------------------------*/

export interface LlmAdapter {
  /** Stable identifier for logging / diagnostics. */
  readonly name: string;
  generatePaper(input: GenerationInput): Promise<QuestionPaper>;
}

export class LlmGenerationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "LlmGenerationError";
  }
}
