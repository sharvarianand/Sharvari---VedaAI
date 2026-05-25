import { Worker } from "bullmq";
import { logger } from "../../config/logger.js";
import { bullConnection, QUEUES, type PdfJobData } from "../queues.js";
import { AssignmentModel } from "../../models/Assignment.js";
import { renderAssignmentPdf } from "../../services/pdf-service.js";
import { emitToAssignment } from "../../sockets/index.js";
import { env } from "../../config/env.js";

/**
 * PDF worker: renders the assignment's question paper into a PDF using
 * Puppeteer and stores the file path back on the assignment so subsequent
 * downloads can stream it without re-rendering.
 */
export function startPdfWorker(): Worker<PdfJobData> {
  const worker = new Worker<PdfJobData>(
    QUEUES.pdf,
    async (job) => {
      const { assignmentId } = job.data;
      logger.info({ assignmentId, jobId: job.id }, "pdf render start");
      await AssignmentModel.updateOne(
        { _id: assignmentId },
        { pdfStatus: "generating" }
      );

      const path = await renderAssignmentPdf(assignmentId);

      await AssignmentModel.updateOne(
        { _id: assignmentId },
        { pdfPath: path, pdfStatus: "ready" }
      );
      const url = `${env.PUBLIC_BASE_URL}/api/assignments/${assignmentId}/pdf`;
      emitToAssignment(assignmentId, { type: "pdf.ready", id: assignmentId, url });
      logger.info({ assignmentId, jobId: job.id }, "pdf ready");
    },
    { connection: bullConnection(), concurrency: 1 }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    logger.error({ err, jobId: job.id }, "pdf job failed");
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const assignmentId = job.data.assignmentId;
      await AssignmentModel.updateOne(
        { _id: assignmentId },
        { pdfStatus: "failed" }
      );
      emitToAssignment(assignmentId, {
        type: "pdf.failed",
        id: assignmentId,
        error: err.message,
      });
    }
  });

  worker.on("error", (err) => logger.error({ err }, "pdf worker error"));
  return worker;
}
