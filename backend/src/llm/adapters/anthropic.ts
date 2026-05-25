import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, buildVariantPrompt } from "../prompt.js";
import { parsePaper, parseVariants } from "../parser.js";
import { LlmGenerationError, type GenerationInput, type LlmAdapter, type GenerationResult } from "../types.js";

/**
 * Anthropic Claude adapter using the Messages API.
 * We send the system prompt out-of-band and the user prompt as a single message.
 */
export class AnthropicAdapter implements LlmAdapter {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-3-5-haiku-latest") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generatePaper(input: GenerationInput): Promise<GenerationResult> {
    const useVariants = input.generateVariants ?? false;
    const { system, user } = useVariants ? buildVariantPrompt(input) : buildPrompt(input);
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.7,
        system,
        messages: [{ role: "user", content: user }],
      });
      const part = response.content.find((c) => c.type === "text");
      const raw = part?.type === "text" ? part.text : "";
      if (!raw) throw new LlmGenerationError("Anthropic returned no text content");
      
      if (useVariants) {
        const { setA, setB } = parseVariants(raw);
        return { paper: setA, variantPaper: setB };
      }

      const paper = parsePaper(raw);
      return { paper };
    } catch (err) {
      if (err instanceof LlmGenerationError) throw err;
      throw new LlmGenerationError("Anthropic request failed", err);
    }
  }
}
