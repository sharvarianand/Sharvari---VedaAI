import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { MockLlmAdapter } from "./adapters/mock.js";
import { OpenAiAdapter } from "./adapters/openai.js";
import { OpenRouterAdapter } from "./adapters/openrouter.js";
import { GeminiAdapter } from "./adapters/gemini.js";
import { AnthropicAdapter } from "./adapters/anthropic.js";
import type { LlmAdapter } from "./types.js";

/**
 * Build the configured LLM adapter at boot.
 *
 * If a real provider is selected but its API key is missing, we fall back
 * to the mock adapter and log a loud warning. This keeps the system
 * runnable in any deployment without surprising 500s.
 */
let _adapter: LlmAdapter | null = null;

export function getLlmAdapter(): LlmAdapter {
  if (_adapter) return _adapter;

  switch (env.LLM_PROVIDER) {
    case "openai":
      if (env.OPENAI_API_KEY) {
        _adapter = new OpenAiAdapter(env.OPENAI_API_KEY, env.LLM_MODEL || undefined);
        break;
      }
      logger.warn("LLM_PROVIDER=openai but OPENAI_API_KEY is empty; using mock");
      _adapter = new MockLlmAdapter();
      break;
    case "gemini":
      if (env.GEMINI_API_KEY) {
        _adapter = new GeminiAdapter(env.GEMINI_API_KEY, env.LLM_MODEL || undefined);
        break;
      }
      logger.warn("LLM_PROVIDER=gemini but GEMINI_API_KEY is empty; using mock");
      _adapter = new MockLlmAdapter();
      break;
    case "openrouter":
      if (env.OPENROUTER_API_KEY) {
        const model = (env.LLM_MODEL || env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-30b-a3b:free")
          .replace(/^["']|["']$/g, "");
        _adapter = new OpenRouterAdapter(
          env.OPENROUTER_API_KEY,
          model,
          {
            referer: env.OPENROUTER_SITE_URL,
            title: env.OPENROUTER_APP_NAME,
          }
        );
        break;
      }
      logger.warn("LLM_PROVIDER=openrouter but OPENROUTER_API_KEY is empty; using mock");
      _adapter = new MockLlmAdapter();
      break;
    case "anthropic":
      if (env.ANTHROPIC_API_KEY) {
        _adapter = new AnthropicAdapter(env.ANTHROPIC_API_KEY, env.LLM_MODEL || undefined);
        break;
      }
      logger.warn("LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is empty; using mock");
      _adapter = new MockLlmAdapter();
      break;
    case "mock":
    default:
      _adapter = new MockLlmAdapter();
  }

  logger.info({ provider: _adapter.name }, "llm adapter ready");
  return _adapter;
}

export * from "./types.js";
