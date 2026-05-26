import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../config/logger.js";

const execFileAsync = promisify(execFile);
// Keep grounding context short enough that it helps the model instead of
// bloating prompt latency for every generation call. We raised this from
// 16k to 24k so longer chapters survive end-to-end after deduplication.
const MAX_SNIPPET_CHARS = 24000;
const MIN_USABLE_CHARS = 40;

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

/** True when the extracted text is long enough to actually ground a paper. */
export function isMaterialTextUsable(text: string | undefined | null): boolean {
  return !!text && text.trim().length >= MIN_USABLE_CHARS;
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
    if (extracted && isMaterialTextUsable(extracted)) return extracted;

    const buffer = await readFile(material.storedPath);
    const heuristic = extractPdfHeuristically(buffer);
    if (!isMaterialTextUsable(heuristic)) {
      logger.warn(
        { path: material.storedPath },
        "pdf material yielded no usable text — paper will be weakly grounded"
      );
    }
    return heuristic;
  }

  // Images (jpeg/png) are accepted by the upload middleware but we don't OCR
  // them in v1. Log so operators understand why the paper isn't grounded.
  if (material.mime?.startsWith("image/")) {
    logger.warn(
      { path: material.storedPath, mime: material.mime },
      "image material uploaded but OCR is not enabled — extractedText will be empty"
    );
    return "";
  }

  return "";
}
