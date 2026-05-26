import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../config/logger.js";
import Tesseract from "tesseract.js";

const execFileAsync = promisify(execFile);
// Keep grounding context short enough that it helps the model instead of
// bloating prompt latency for every generation call. We raised this from
// 16k to 24k so longer chapters survive end-to-end after deduplication.
const MAX_SNIPPET_CHARS = 24000;
const MIN_USABLE_CHARS = 40;
/** Minimum fraction of alphabetic/space characters for text to be "readable". */
const MIN_READABILITY_RATIO = 0.5;
/** Minimum number of distinct English-like words (3+ alpha chars) required. */
const MIN_WORD_COUNT = 5;

/**
 * PDF internal keywords that should never dominate extracted text.
 * If these account for a large share of the "words", the extraction is garbage.
 */
const PDF_JUNK_KEYWORDS = new Set([
  "endobj", "endstream", "xobject", "flatedecode", "stream", "obj",
  "catalog", "filter", "length", "subtype", "type", "font",
  "embeddedfiles", "nums", "count", "pages", "resources", "mediabox",
  "contents", "procset", "extgstate", "baseencoding", "widths",
  "fontdescriptor", "fontname", "fontbbox", "italicangle", "ascent",
  "descent", "capheight", "stemv", "flags", "encoding", "tounicode",
]);

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

/**
 * Score how "readable" a piece of text is.  A score >= MIN_READABILITY_RATIO
 * indicates genuine natural-language content rather than binary garbage or
 * PDF structural keywords.
 */
function isReadableText(text: string): boolean {
  if (!text || text.length < MIN_USABLE_CHARS) return false;

  // 1. Check that a majority of characters are alphabetic or whitespace
  const sample = text.slice(0, 2000);
  const readableChars = [...sample].filter(
    (c) => /[a-zA-Z\s]/.test(c)
  ).length;
  const ratio = readableChars / sample.length;
  if (ratio < MIN_READABILITY_RATIO) return false;

  // 2. Check for a minimum number of real words (3+ alpha chars)
  const words = text.match(/[a-zA-Z]{3,}/g) ?? [];
  if (words.length < MIN_WORD_COUNT) return false;

  // 3. Check that PDF internal junk keywords don't dominate the text
  const wordSample = words.slice(0, 200);
  const junkCount = wordSample.filter((w) =>
    PDF_JUNK_KEYWORDS.has(w.toLowerCase())
  ).length;
  const junkRatio = junkCount / wordSample.length;
  if (junkRatio > 0.15) {
    logger.debug(
      { junkRatio: junkRatio.toFixed(2), junkCount, sampleSize: wordSample.length },
      "text rejected: too many PDF-internal keywords"
    );
    return false;
  }

  return true;
}

function extractPdfHeuristically(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const literalMatches = [...raw.matchAll(/\(([^()]*)\)/g)]
    .map((match) => decodePdfLiteralEscapes(match[1] ?? ""))
    .filter((value) => /[A-Za-z]{3,}/.test(value));
  if (literalMatches.length > 0) {
    const joined = clip(normalizeWhitespace(literalMatches.join(" ")));
    // Validate that the heuristic output is actually readable text
    if (isReadableText(joined)) return joined;
    logger.debug("heuristic literal-match extraction produced unreadable text, trying ASCII runs");
  }

  const asciiRuns = raw.match(/[A-Za-z0-9,.;:()\-/"'%& ]{20,}/g) ?? [];
  const joined = clip(normalizeWhitespace(asciiRuns.join(" ")));
  // Validate ASCII-run output too
  if (isReadableText(joined)) return joined;

  logger.debug("heuristic ASCII-run extraction also produced unreadable text");
  return "";
}

async function extractPdfWithPdftotext(path: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("pdftotext", ["-layout", path, "-"]);
    const cleaned = clip(normalizeWhitespace(stdout));
    if (!cleaned) return null;
    // Even pdftotext can occasionally produce garbage on encrypted/scanned PDFs
    if (!isReadableText(cleaned)) {
      logger.debug({ path }, "pdftotext output failed readability check");
      return null;
    }
    return cleaned;
  } catch (error) {
    logger.debug({ err: error, path }, "pdftotext unavailable or failed");
    return null;
  }
}

/**
 * True when the extracted text is both long enough and readable enough
 * to actually ground a paper.  This is the gate that prevents binary
 * garbage from being cached and reused across regeneration attempts.
 */
export function isMaterialTextUsable(text: string | undefined | null): boolean {
  return !!text && isReadableText(text);
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

  // Images (jpeg/png) are accepted by the upload middleware. We now OCR them!
  if (material.mime?.startsWith("image/")) {
    try {
      logger.info({ path: material.storedPath }, "Running OCR on image material...");
      // Initialize OCR with English language. The logger callback lets us see progress in debug mode.
      const { data: { text } } = await Tesseract.recognize(
        material.storedPath,
        "eng",
        { logger: m => logger.debug(m) }
      );
      
      const cleaned = clip(normalizeWhitespace(text));
      
      if (!isMaterialTextUsable(cleaned)) {
        logger.warn(
          { path: material.storedPath },
          "OCR completed but yielded no usable text — paper will be weakly grounded"
        );
        return "";
      }
      
      logger.info({ length: cleaned.length }, "OCR completed successfully");
      return cleaned;
    } catch (err: any) {
      logger.error({ err, path: material.storedPath }, "OCR extraction failed");
      return "";
    }
  }

  return "";
}
