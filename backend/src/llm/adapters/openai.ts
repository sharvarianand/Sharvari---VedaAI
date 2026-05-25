import OpenAI from "openai";
import { buildPrompt } from "../prompt.js";
import { parsePaper } from "../parser.js";
import { LlmGenerationError, type GenerationInput, type LlmAdapter, type QuestionPaper } from "../types.js";

/**
 * OpenAI Chat Completions adapter using JSON-mode for reliable parsing.
 */
export class OpenAiAdapter implements LlmAdapter {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generatePaper(input: GenerationInput): Promise<QuestionPaper> {
    const { system, user } = buildPrompt(input);
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const raw = completion.choices[0]?.message?.content ?? "";
      if (!raw) throw new LlmGenerationError("OpenAI returned an empty response");
      return parsePaper(raw);
    } catch (err) {
      if (err instanceof LlmGenerationError) throw err;
      throw new LlmGenerationError("OpenAI request failed", err);
    }
  }
}
