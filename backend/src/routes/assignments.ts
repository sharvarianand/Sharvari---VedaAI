import { Router } from "express";
import { z } from "zod";
import { existsSync } from "node:fs";
import { AssignmentService } from "../services/assignment-service.js";
import { uploadMaterial } from "../middleware/upload.js";
import { asyncHandler, BadRequest, NotFound } from "../middleware/error.js";
import { pdfQueue } from "../queue/queues.js";
import { AssignmentModel } from "../models/Assignment.js";
import { emitToAssignment } from "../sockets/index.js";
import { QuestionPaperSchema, QuestionTypeConfigSchema } from "../llm/types.js";

export const assignmentsRouter = Router();

/* -----------------------------------------------------------------
 * Schemas
 * ---------------------------------------------------------------*/

const createBodySchema = z.object({
  title: z.string().trim().min(1).max(120).default("Generated Question Paper"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be ISO yyyy-mm-dd"),
  questionTypes: z
    .union([z.string(), z.array(QuestionTypeConfigSchema)])
    .transform((v) => (typeof v === "string" ? JSON.parse(v) : v))
    .pipe(z.array(QuestionTypeConfigSchema).min(1)),
  additionalInstructions: z.string().max(2000).default(""),
  schoolName: z.string().trim().min(1).default("Delhi Public School, Sector-4, Bokaro"),
  subject: z.string().trim().min(1).default("General Studies"),
  className: z.string().trim().min(1).default("5th"),
  language: z.enum(["english", "hindi", "bilingual"]).default("english"),
  generateVariants: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .pipe(z.boolean())
    .default(false),
});

const idParamSchema = z.object({ id: z.string().min(8).max(64) });
const updateBodySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    paper: QuestionPaperSchema.optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((body) => body.title !== undefined || body.paper !== undefined, {
    message: "Provide title or paper to update",
  });
const regenerateBodySchema = z.object({
  instructions: z.string().trim().max(1200).optional(),
});

/* -----------------------------------------------------------------
 * Routes
 * ---------------------------------------------------------------*/

assignmentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const docs = await AssignmentService.list();
    res.json({ items: docs.map((d) => d.toObject({ versionKey: false })) });
  })
);

assignmentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const doc = await AssignmentService.get(id);
    res.json(doc.toObject({ versionKey: false }));
  })
);

assignmentsRouter.post(
  "/",
  uploadMaterial.single("file"),
  asyncHandler(async (req, res) => {
    const body = createBodySchema.parse(req.body);

    const totalQuestions = body.questionTypes.reduce((s, q) => s + q.count, 0);
    if (totalQuestions === 0) throw BadRequest("At least one question is required");
    if (totalQuestions > 200) throw BadRequest("Maximum 200 questions per paper");

    const doc = await AssignmentService.create({
      title: body.title,
      dueDate: body.dueDate,
      questionTypes: body.questionTypes,
      additionalInstructions: body.additionalInstructions,
      schoolName: body.schoolName,
      subject: body.subject,
      className: body.className,
      language: body.language,
      generateVariants: body.generateVariants,
      material: req.file
        ? {
            tempPath: req.file.path,
            originalName: req.file.originalname,
            size: req.file.size,
            mime: req.file.mimetype,
          }
        : undefined,
    });

    res.status(201).json(doc.toObject({ versionKey: false }));
  })
);

assignmentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await AssignmentService.remove(id);
    res.status(204).send();
  })
);

assignmentsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updateBodySchema.parse(req.body);
    const doc = await AssignmentService.savePaper(id, body);
    const serialized = doc.toObject({ versionKey: false });
    emitToAssignment(id, { type: "assignment.updated", assignment: serialized as never });
    res.json(serialized);
  })
);

assignmentsRouter.post(
  "/:id/regenerate",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = regenerateBodySchema.parse(req.body ?? {});
    const doc = await AssignmentService.regenerate(id, body.instructions);
    res.json(doc.toObject({ versionKey: false }));
  })
);

/**
 * Restore a previous version's paper as the current active paper.
 */
assignmentsRouter.post(
  "/:id/restore/:version",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const version = Number((req.params as { version: string }).version);
    if (!Number.isInteger(version) || version < 1) {
      throw BadRequest("Invalid version number");
    }
    const doc = await AssignmentService.restoreVersion(id, version);
    const serialized = doc.toObject({ versionKey: false });
    emitToAssignment(id, { type: "assignment.updated", assignment: serialized as never });
    res.json(serialized);
  })
);

/**
 * Stream the PDF. If the file isn't on disk yet (or the request is the
 * first one after generation completed) we enqueue the puppeteer job and
 * either wait briefly for it to land, or 202-accept the request so the
 * client can subscribe to `pdf.ready` over the socket.
 */
assignmentsRouter.get(
  "/:id/pdf",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const doc = await AssignmentService.get(id);
    if (doc.status !== "ready" || !doc.paper) {
      throw BadRequest("Assignment is not ready yet");
    }

    if (doc.pdfPath && existsSync(doc.pdfPath)) {
      res.download(doc.pdfPath, `${doc.title}.pdf`);
      return;
    }

    if (doc.pdfStatus !== "queued" && doc.pdfStatus !== "generating") {
      await AssignmentModel.updateOne({ _id: id }, { pdfStatus: "queued" });
      await pdfQueue.add(
        "render",
        { assignmentId: id },
        { jobId: `pdf-${id}-${Date.now()}` }
      );
      emitToAssignment(id, { type: "pdf.queued", id });
    }

    res.status(202).json({
      status: "accepted",
      message: "PDF rendering in progress; subscribe to pdf.ready via WebSocket.",
    });
  })
);

/** Helper: throw 404 if id missing — used by print router. */
assignmentsRouter.use((req, _res, next) => {
  if (req.method === "GET" && req.path === "/") return next();
  if (!req.route) next(NotFound("route"));
  else next();
});
