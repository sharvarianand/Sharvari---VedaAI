import OpenAI from "openai";
import { buildPrompt } from "../prompt.js";
import { parsePaper } from "../parser.js";
import {
  LlmGenerationError,
  type GenerationInput,
  type LlmAdapter,
  type QuestionPaper,
} from "../types.js";

/**
 * OpenRouter exposes an OpenAI-compatible chat completions API.
 *
 * We keep this adapter separate from the OpenAI adapter so deployment config
 * stays explicit and the default model can target OpenRouter's free NVIDIA
 * model without overloading the meaning of `OPENAI_API_KEY`.
 */
export class OpenRouterAdapter implements LlmAdapter {
  readonly name = "openrouter";
  private client: OpenAI;
  private model: string;

  constructor(
    apiKey: string,
    model = "nvidia/nemotron-3-nano-30b-a3b:free",
    headers?: { referer?: string; title?: string }
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        ...(headers?.referer ? { "HTTP-Referer": headers.referer } : {}),
        ...(headers?.title ? { "X-Title": headers.title } : {}),
      },
    });
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
      if (!raw) throw new LlmGenerationError("OpenRouter returned an empty response");
      return parsePaper(raw);
    } catch (err) {
      if (err instanceof LlmGenerationError) throw err;
      throw new LlmGenerationError("OpenRouter request failed", err);
    }
  }
}
