import { rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { AssignmentModel, type AssignmentDoc } from "../models/Assignment.js";
import { newAssignmentId } from "../utils/ids.js";
import { generationQueue } from "../queue/queues.js";
import { emitToAssignment } from "../sockets/index.js";
import { NotFound } from "../middleware/error.js";
import type { GenerationInput, QuestionPaper, PaperLanguage } from "../llm/types.js";
import type { QuestionTypeConfig } from "../llm/types.js";
import { extractMaterialText } from "./material-service.js";

export interface CreateInput {
  title: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  regenerationInstructions?: string;
  schoolName: string;
  subject: string;
  className: string;
  language?: PaperLanguage;
  generateVariants?: boolean;
  material?: { tempPath: string; originalName: string; size: number; mime: string };
}

export interface SavePaperInput {
  title?: string;
  paper?: QuestionPaper;
  note?: string;
}

type PaperVersionSource = "ai" | "manual";

function normalizePaper(paper: QuestionPaper): QuestionPaper {
  const maximumMarks = paper.sections.reduce(
    (sectionSum, section) =>
      sectionSum +
      section.questions.reduce(
        (questionSum, question) => questionSum + question.marks,
        0
      ),
    0
  );

  return { ...paper, maximumMarks };
}

export const AssignmentService = {
  async list(teacherId = "demo-teacher"): Promise<AssignmentDoc[]> {
    return AssignmentModel.find({ teacherId }).sort({ createdAt: -1 }).limit(100);
  },

  async get(id: string): Promise<AssignmentDoc> {
    const doc = await AssignmentModel.findById(id);
    if (!doc) throw NotFound("Assignment", id);
    return doc;
  },

  async create(input: CreateInput): Promise<AssignmentDoc> {
    const id = newAssignmentId();

    let material: AssignmentDoc["draft"]["material"] | undefined;
    if (input.material) {
      // Move the temp upload under the assignment id so we never leak files
      // when concurrent uploads happen.
      const finalDir = join(process.cwd(), "uploads", id);
      await mkdir(finalDir, { recursive: true });
      const finalPath = join(finalDir, input.material.originalName);
      await mkdir(dirname(finalPath), { recursive: true });
      await rename(input.material.tempPath, finalPath);
      material = {
        name: input.material.originalName,
        size: input.material.size,
        mime: input.material.mime,
        storedPath: finalPath,
      };
    }

    const doc = await AssignmentModel.create({
      _id: id,
      title: input.title,
      status: "queued",
      draft: {
        material,
        dueDate: input.dueDate,
        questionTypes: input.questionTypes,
        additionalInstructions: input.additionalInstructions,
        regenerationInstructions: input.regenerationInstructions ?? "",
        schoolName: input.schoolName,
        subject: input.subject,
        className: input.className,
        language: input.language ?? "english",
        generateVariants: input.generateVariants ?? false,
      },
    });

    const job = await generationQueue.add(
      "generate",
      { assignmentId: id },
      { jobId: `gen-${id}` }
    );
    doc.jobId = job.id ?? undefined;
    await doc.save();

    emitToAssignment(id, {
      type: "assignment.queued",
      id,
      jobId: doc.jobId ?? "",
    });

    return doc;
  },

  async remove(id: string): Promise<void> {
    const res = await AssignmentModel.deleteOne({ _id: id });
    if (res.deletedCount === 0) throw NotFound("Assignment", id);
  },

  async regenerate(id: string, regenerationInstructions?: string, lockedQuestionIds?: string[]): Promise<AssignmentDoc> {
    const doc = await this.get(id);
    doc.status = "queued";
    doc.error = undefined as unknown as string;
    doc.draft.regenerationInstructions = regenerationInstructions?.trim() ?? "";
    await doc.save();
    const job = await generationQueue.add(
      "generate",
      { assignmentId: id, lockedQuestionIds },
      { jobId: `gen-${id}-${Date.now()}` }
    );
    doc.jobId = job.id ?? undefined;
    await doc.save();
    emitToAssignment(id, { type: "assignment.queued", id, jobId: doc.jobId ?? "" });
    return doc;
  },

  /** Convert a stored draft into the input shape expected by the LLM. */
  async toGenerationInput(doc: AssignmentDoc): Promise<GenerationInput> {
    const d = doc.draft;
    let extractedText = d.material?.extractedText ?? "";

    if (!extractedText && d.material?.storedPath) {
      extractedText = await extractMaterialText(d.material);
      if (extractedText) {
        d.material.extractedText = extractedText;
        await doc.save();
      }
    }

    return {
      material: d.material
        ? {
            name: d.material.name ?? "material",
            size: d.material.size ?? 0,
            mime: d.material.mime ?? "application/octet-stream",
            extractedText,
          }
        : undefined,
      dueDate: d.dueDate,
      questionTypes: d.questionTypes as QuestionTypeConfig[],
      additionalInstructions: d.additionalInstructions ?? "",
      regenerationInstructions: d.regenerationInstructions ?? "",
      schoolName: d.schoolName ?? "Delhi Public School, Sector-4, Bokaro",
      subject: d.subject ?? "General Studies",
      className: d.className ?? "5th",
      language: (d as any).language ?? "english",
      generateVariants: (d as any).generateVariants ?? false,
    };
  },

  async markGenerating(id: string): Promise<void> {
    await AssignmentModel.updateOne({ _id: id }, { status: "generating" });
  },

  async markReady(
    id: string,
    paper: QuestionPaper,
    meta?: { note?: string; source?: PaperVersionSource; variantPaper?: QuestionPaper }
  ): Promise<AssignmentDoc> {
    const doc = await this.get(id);
    const nextVersion = (doc.currentVersion ?? 0) + 1;
    const normalizedPaper = normalizePaper(paper);

    doc.status = "ready";
    doc.paper = normalizedPaper;
    doc.error = undefined as unknown as string;
    doc.currentVersion = nextVersion;

    // Store variant paper (Set B) if present
    if (meta?.variantPaper) {
      (doc as any).variantPaper = normalizePaper(meta.variantPaper);
    }

    if (!doc.paperVersions) {
      doc.paperVersions = [] as any;
    }
    (doc.paperVersions as any).push({
      version: nextVersion,
      title: doc.title,
      source: meta?.source ?? "ai",
      note: meta?.note ?? "",
      paper: normalizedPaper,
      createdAt: new Date(),
    });
    await doc.save();
    return doc;
  },

  async markFailed(id: string, error: string): Promise<void> {
    await AssignmentModel.updateOne({ _id: id }, { status: "failed", error });
  },

  async savePaper(id: string, input: SavePaperInput): Promise<AssignmentDoc> {
    const doc = await this.get(id);

    if (input.title) doc.title = input.title;

    if (input.paper) {
      const nextVersion = (doc.currentVersion ?? 0) + 1;
      const normalizedPaper = normalizePaper(input.paper);
      doc.paper = normalizedPaper;
      doc.status = "ready";
      doc.error = undefined as unknown as string;
      doc.currentVersion = nextVersion;
      if (!doc.paperVersions) {
        doc.paperVersions = [] as any;
      }
      (doc.paperVersions as any).push({
        version: nextVersion,
        title: doc.title,
        source: "manual",
        note: input.note ?? "",
        paper: normalizedPaper,
        createdAt: new Date(),
      });
    }

    await doc.save();
    return doc;
  },

  /**
   * Restore a specific version's paper as the current active paper.
   * Creates a new version entry with "restored from vN" note.
   */
  async restoreVersion(id: string, targetVersion: number): Promise<AssignmentDoc> {
    const doc = await this.get(id);
    const versions = (doc.paperVersions as any) ?? [];
    const target = versions.find((v: any) => v.version === targetVersion);
    if (!target) throw NotFound("PaperVersion", String(targetVersion));

    const nextVersion = (doc.currentVersion ?? 0) + 1;
    const restoredPaper = normalizePaper(target.paper);

    doc.paper = restoredPaper;
    doc.status = "ready";
    doc.currentVersion = nextVersion;
    doc.error = undefined as unknown as string;

    (doc.paperVersions as any).push({
      version: nextVersion,
      title: doc.title,
      source: "manual" as PaperVersionSource,
      note: `Restored from v${targetVersion}`,
      paper: restoredPaper,
      createdAt: new Date(),
    });

    await doc.save();
    return doc;
  },
};
