import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "../prompt.js";
import { parsePaper } from "../parser.js";
import { LlmGenerationError, type GenerationInput, type LlmAdapter, type QuestionPaper } from "../types.js";

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

  async generatePaper(input: GenerationInput): Promise<QuestionPaper> {
    const { system, user } = buildPrompt(input);
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
      return parsePaper(raw);
    } catch (err) {
      if (err instanceof LlmGenerationError) throw err;
      throw new LlmGenerationError("Gemini request failed", err);
    }
  }
}
