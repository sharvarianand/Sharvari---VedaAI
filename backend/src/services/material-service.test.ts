import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { extractMaterialText } from "./material-service.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

async function withTempFile(name: string, content: string | Buffer) {
  const dir = await mkdtemp(join(tmpdir(), "vedaai-material-"));
  tempDirs.push(dir);
  const path = join(dir, name);
  await writeFile(path, content);
  return path;
}

describe("extractMaterialText", () => {
  it("extracts plain text files directly", async () => {
    const path = await withTempFile(
      "chapter.txt",
      "Electric current flows through a closed circuit."
    );

    const text = await extractMaterialText({
      storedPath: path,
      mime: "text/plain",
    });

    expect(text).toMatch(/Electric current flows/);
  });

  it("falls back to heuristic PDF text extraction", async () => {
    const pseudoPdf = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<<>>\nstream\nBT\n(Current and resistance are key concepts.) Tj\nET\nendstream\nendobj\n%%EOF",
      "latin1"
    );
    const path = await withTempFile("chapter.pdf", pseudoPdf);

    const text = await extractMaterialText({
      storedPath: path,
      mime: "application/pdf",
    });

    expect(text).toMatch(/Current and resistance/);
  });

  it("returns empty string when no material path is present", async () => {
    const text = await extractMaterialText({
      storedPath: "",
      mime: "application/pdf",
    });

    expect(text).toBe("");
  });
});
