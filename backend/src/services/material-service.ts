import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../config/logger.js";

const execFileAsync = promisify(execFile);
// Keep grounding context short enough that it helps the model instead of
// bloating prompt latency for every generation call.
const MAX_SNIPPET_CHARS = 16000;

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function clip(input: string, limit = MAX_SNIPPET_CHARS): string {
  return input.length <= limit ? input : `${input.slice(0, limit)}…`;
}

function decodePdfLiteralEscapes(input: string): string {
  return input
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractPdfHeuristically(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const literalMatches = [...raw.matchAll(/\(([^()]*)\)/g)]
    .map((match) => decodePdfLiteralEscapes(match[1] ?? ""))
    .filter((value) => /[A-Za-z]{3,}/.test(value));
  if (literalMatches.length > 0) {
    return clip(normalizeWhitespace(literalMatches.join(" ")));
  }

  const asciiRuns = raw.match(/[A-Za-z0-9,.;:()\-/"'%& ]{20,}/g) ?? [];
  return clip(normalizeWhitespace(asciiRuns.join(" ")));
}

async function extractPdfWithPdftotext(path: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("pdftotext", ["-layout", path, "-"]);
    const cleaned = clip(normalizeWhitespace(stdout));
    return cleaned || null;
  } catch (error) {
    logger.debug({ err: error, path }, "pdftotext unavailable or failed");
    return null;
  }
}

export async function extractMaterialText(
  material:
    | {
        storedPath?: string | null;
        mime?: string | null;
      }
    | undefined
): Promise<string> {
  if (!material?.storedPath) return "";

  if (material.mime === "text/plain") {
    const text = await readFile(material.storedPath, "utf8");
    return clip(normalizeWhitespace(text));
  }

  if (material.mime === "application/pdf") {
    const extracted = await extractPdfWithPdftotext(material.storedPath);
    if (extracted) return extracted;

    const buffer = await readFile(material.storedPath);
    return extractPdfHeuristically(buffer);
  }

  return "";
}
