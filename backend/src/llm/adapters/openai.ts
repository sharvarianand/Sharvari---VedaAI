import OpenAI from "openai";
import { buildPrompt, buildVariantPrompt } from "../prompt.js";
import { parsePaper, parseVariants } from "../parser.js";
import { LlmGenerationError, type GenerationInput, type LlmAdapter, type GenerationResult } from "../types.js";

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

  async generatePaper(input: GenerationInput): Promise<GenerationResult> {
    const useVariants = input.generateVariants ?? false;
    const { system, user } = useVariants ? buildVariantPrompt(input) : buildPrompt(input);
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
      
      if (useVariants) {
        const { setA, setB } = parseVariants(raw);
        return { paper: setA, variantPaper: setB };
      }

      const paper = parsePaper(raw);
      return { paper };
    } catch (err) {
      if (err instanceof LlmGenerationError) throw err;
      throw new LlmGenerationError("OpenAI request failed", err);
    }
  }
}
