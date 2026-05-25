import { Router } from "express";
import { z } from "zod";
import { asyncHandler, NotFound } from "../middleware/error.js";
import { AssignmentService } from "../services/assignment-service.js";
import { renderPaperHtml } from "./print-template.js";

export const printRouter = Router();

const idSchema = z.object({ id: z.string().min(8).max(64) });

/**
 * Internal HTML route consumed by Puppeteer to produce the PDF.
 * Inlines all CSS so the rendered document has zero external dependencies.
 */
printRouter.get(
  "/print/paper/:id",
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const doc = await AssignmentService.get(id);
    if (!doc.paper) throw NotFound("Question paper", id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderPaperHtml(doc.toObject() as never));
  })
);
