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
  id: z.string().min(1).max(50),
  text: z.string().min(1).max(5000),
  difficulty: DifficultySchema,
  marks: z.number().int().min(1).max(100),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SectionSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  heading: z.string().min(1).max(150),
  instruction: z.string().max(1000),
  questions: z.array(QuestionSchema).min(1),
});
export type Section = z.infer<typeof SectionSchema>;

export const QuestionPaperSchema = z.object({
  schoolName: z.string().trim().min(1).max(150),
  subject: z.string().trim().min(1).max(100),
  className: z.string().trim().min(1).max(50),
  timeAllowedMinutes: z.number().int().min(5).max(360),
  maximumMarks: z.number().int().min(1).max(1000),
  sections: z.array(SectionSchema).min(1),
  answerKey: z.array(
    z.object({
      questionId: z.string().min(1).max(50),
      answer: z.string().min(1).max(5000),
    })
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

export type PaperLanguage = "english" | "hindi" | "bilingual";

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
  /** Language for paper generation. */
  language: PaperLanguage;
  /** Generate two variant sets (Set A / Set B) with same difficulty. */
  generateVariants?: boolean;
}

/* -----------------------------------------------------------------
 * Adapter contract
 * ---------------------------------------------------------------*/

export interface GenerationResult {
  paper: QuestionPaper;
  variantPaper?: QuestionPaper;
}

export interface LlmAdapter {
  /** Stable identifier for logging / diagnostics. */
  readonly name: string;
  generatePaper(input: GenerationInput): Promise<GenerationResult>;
}

export class LlmGenerationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "LlmGenerationError";
  }
}
