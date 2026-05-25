import { LlmGenerationError, QuestionPaperSchema, type QuestionPaper } from "./types.js";

/**
 * Robustly extract a JSON object from an LLM response.
 *
 * Real-world models occasionally wrap JSON in ```json fences or prepend a
 * sentence even when instructed not to. We recover from those cases instead
 * of failing the whole job.
 */
export function extractJson(raw: string): string {
  const trimmed = raw.trim();

  // Strip ```json ... ``` or ``` ... ``` fences.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/i);
  if (fenced && fenced[1]) return fenced[1].trim();

  // Otherwise, slice from the first '{' to the matching last '}'.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  return trimmed;
}

/**
 * Parse + validate a model response. Throws an LlmGenerationError with
 * context-rich detail so the worker can decide whether to retry.
 */
export function parsePaper(raw: string): QuestionPaper {
  const json = extractJson(raw);
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new LlmGenerationError(
      "Model response was not valid JSON",
      err
    );
  }

  const result = QuestionPaperSchema.safeParse(data);
  if (!result.success) {
    throw new LlmGenerationError(
      `Model response failed schema validation: ${result.error.message}`,
      result.error
    );
  }
  return result.data;
}
