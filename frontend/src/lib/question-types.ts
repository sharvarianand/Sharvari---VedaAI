import type { QuestionTypeKey } from "@/types/assignment";

export interface QuestionTypeOption {
  value: QuestionTypeKey;
  label: string;
}

/** Catalogue of question types the teacher can configure. */
export const QUESTION_TYPE_OPTIONS: QuestionTypeOption[] = [
  { value: "mcq", label: "Multiple Choice Questions" },
  { value: "short", label: "Short Questions" },
  { value: "long", label: "Long Questions" },
  { value: "diagram", label: "Diagram/Graph-Based Questions" },
  { value: "numerical", label: "Numerical Problems" },
  { value: "true-false", label: "True / False" },
  { value: "fill-blanks", label: "Fill in the Blanks" },
];

export function labelFor(type: QuestionTypeKey): string {
  return (
    QUESTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
  );
}
