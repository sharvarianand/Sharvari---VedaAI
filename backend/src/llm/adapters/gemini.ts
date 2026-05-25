import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt, buildVariantPrompt } from "../prompt.js";
import { parsePaper, parseVariants } from "../parser.js";
import { LlmGenerationError, type GenerationInput, type LlmAdapter, type GenerationResult } from "../types.js";

/**
 * Google Gemini adapter.
 *
 * We pin `responseMimeType` to application/json so the model returns
 * machine-parseable output without needing prompt-engineered fences.
 */
export class GeminiAdapter implements LlmAdapter {
  readonly name = "gemini";
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, model = "gemini-1.5-flash") {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
  }

  async generatePaper(input: GenerationInput): Promise<GenerationResult> {
    const useVariants = input.generateVariants ?? false;
    const { system, user } = useVariants ? buildVariantPrompt(input) : buildPrompt(input);
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: system,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent(user);
      const raw = result.response.text();
      if (!raw) throw new LlmGenerationError("Gemini returned an empty response");
      
      if (useVariants) {
        const { setA, setB } = parseVariants(raw);
        return { paper: setA, variantPaper: setB };
      }

      const paper = parsePaper(raw);
      return { paper };
    } catch (err) {
      if (err instanceof LlmGenerationError) throw err;
      throw new LlmGenerationError("Gemini request failed", err);
    }
  }
}
