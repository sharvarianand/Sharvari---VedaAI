import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import puppeteer, { type Browser } from "puppeteer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Singleton Puppeteer browser. Launching Chromium is expensive (~1 s and
 * hundreds of MB of RAM), so we keep one instance alive and reuse pages.
 * The browser is closed during graceful shutdown.
 */
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  logger.info("puppeteer launched");
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close().catch(() => undefined);
    _browser = null;
  }
}

const PDF_DIR = join(process.cwd(), "uploads", "pdf");

export async function renderAssignmentPdf(assignmentId: string): Promise<string> {
  await mkdir(PDF_DIR, { recursive: true });
  const outputPath = join(PDF_DIR, `${assignmentId}.pdf`);

  const url = `${env.PUBLIC_BASE_URL}/print/paper/${assignmentId}`;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    page.setDefaultNavigationTimeout(30_000);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "16mm", right: "16mm" },
    });
  } finally {
    await page.close();
  }
  return outputPath;
}
