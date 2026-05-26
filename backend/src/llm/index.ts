import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { MockLlmAdapter } from "./adapters/mock.js";
import { OpenAiAdapter } from "./adapters/openai.js";
import { OpenRouterAdapter } from "./adapters/openrouter.js";
import { GeminiAdapter } from "./adapters/gemini.js";
import { AnthropicAdapter } from "./adapters/anthropic.js";
import type { LlmAdapter, GenerationInput, GenerationResult } from "./types.js";

/**
 * Wraps a primary adapter with an optional fallback so that transient
 * API failures (rate limits, 5xx, timeouts) on the primary provider
 * don't block the teacher from getting a paper.
 */
class FallbackAdapter implements LlmAdapter {
  readonly name: string;

  constructor(
    private primary: LlmAdapter,
    private fallback: LlmAdapter | null
  ) {
    this.name = fallback
      ? `${primary.name} → ${fallback.name}`
      : primary.name;
  }

  async generatePaper(input: GenerationInput): Promise<GenerationResult> {
    try {
      return await this.primary.generatePaper(input);
    } catch (err) {
      if (!this.fallback) throw err;
      logger.warn(
        { err, primary: this.primary.name, fallback: this.fallback.name },
        "primary LLM failed, falling back"
      );
      return this.fallback.generatePaper(input);
    }
  }
}

/**
 * Build the configured LLM adapter at boot.
 *
 * If a real provider is selected but its API key is missing, we fall back
 * to the mock adapter and log a loud warning. This keeps the system
 * runnable in any deployment without surprising 500s.
 *
 * When multiple API keys are configured, we set up automatic fallback
 * so that if the primary provider fails, we try the secondary.
 */
let _adapter: LlmAdapter | null = null;

function buildPrimaryAdapter(): LlmAdapter {
  switch (env.LLM_PROVIDER) {
    case "openai":
      if (env.OPENAI_API_KEY) {
        return new OpenAiAdapter(env.OPENAI_API_KEY, env.LLM_MODEL || undefined);
      }
      logger.warn("LLM_PROVIDER=openai but OPENAI_API_KEY is empty; using mock");
      return new MockLlmAdapter();
    case "gemini":
      if (env.GEMINI_API_KEY) {
        return new GeminiAdapter(env.GEMINI_API_KEY, env.LLM_MODEL || undefined);
      }
      logger.warn("LLM_PROVIDER=gemini but GEMINI_API_KEY is empty; using mock");
      return new MockLlmAdapter();
    case "openrouter":
      if (env.OPENROUTER_API_KEY) {
        const model = (env.LLM_MODEL || env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-30b-a3b:free")
          .replace(/^["']|["']$/g, "");
        return new OpenRouterAdapter(
          env.OPENROUTER_API_KEY,
          model,
          {
            referer: env.OPENROUTER_SITE_URL,
            title: env.OPENROUTER_APP_NAME,
          }
        );
      }
      logger.warn("LLM_PROVIDER=openrouter but OPENROUTER_API_KEY is empty; using mock");
      return new MockLlmAdapter();
    case "anthropic":
      if (env.ANTHROPIC_API_KEY) {
        return new AnthropicAdapter(env.ANTHROPIC_API_KEY, env.LLM_MODEL || undefined);
      }
      logger.warn("LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is empty; using mock");
      return new MockLlmAdapter();
    case "mock":
    default:
      return new MockLlmAdapter();
  }
}

/**
 * Build a fallback adapter if a secondary API key is available.
 * We try in order: Gemini → OpenAI → OpenRouter → Anthropic,
 * skipping whichever one is already the primary.
 */
function buildFallbackAdapter(primaryName: string): LlmAdapter | null {
  if (primaryName !== "gemini" && env.GEMINI_API_KEY) {
    return new GeminiAdapter(env.GEMINI_API_KEY);
  }
  if (primaryName !== "openai" && env.OPENAI_API_KEY) {
    return new OpenAiAdapter(env.OPENAI_API_KEY);
  }
  if (primaryName !== "openrouter" && env.OPENROUTER_API_KEY) {
    const model = (env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-30b-a3b:free")
      .replace(/^["']|["']$/g, "");
    return new OpenRouterAdapter(env.OPENROUTER_API_KEY, model);
  }
  if (primaryName !== "anthropic" && env.ANTHROPIC_API_KEY) {
    return new AnthropicAdapter(env.ANTHROPIC_API_KEY);
  }
  return null;
}

export function getLlmAdapter(): LlmAdapter {
  if (_adapter) return _adapter;

  const primary = buildPrimaryAdapter();

  // Only set up fallback for real (non-mock) primary adapters
  if (primary.name !== "mock") {
    const fallback = buildFallbackAdapter(primary.name);
    if (fallback) {
      _adapter = new FallbackAdapter(primary, fallback);
    } else {
      _adapter = primary;
    }
  } else {
    _adapter = primary;
  }

  logger.info({ provider: _adapter.name }, "llm adapter ready");
  return _adapter;
}

export * from "./types.js";
