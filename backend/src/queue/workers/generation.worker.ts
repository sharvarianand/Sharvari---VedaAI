import { Worker } from "bullmq";
import { logger } from "../../config/logger.js";
import { bullConnection, QUEUES, type GenerationJobData } from "../queues.js";
import { AssignmentService } from "../../services/assignment-service.js";
import { getLlmAdapter } from "../../llm/index.js";
import { emitToAssignment } from "../../sockets/index.js";

/**
 * Generation worker: pulls jobs off the queue, calls the configured LLM,
 * persists the resulting paper, and notifies subscribed clients via WS.
 *
 * Errors thrown here are retried automatically by BullMQ (3 attempts with
 * exponential backoff). Once retries are exhausted we mark the assignment
 * as failed so the UI can show a friendly recovery message.
 */
export function startGenerationWorker(): Worker<GenerationJobData> {
  const adapter = getLlmAdapter();

  const worker = new Worker<GenerationJobData>(
    QUEUES.generation,
    async (job) => {
      const { assignmentId } = job.data;
      logger.info({ assignmentId, jobId: job.id }, "generation start");

      const doc = await AssignmentService.get(assignmentId);
      await AssignmentService.markGenerating(assignmentId);
      emitToAssignment(assignmentId, {
        type: "assignment.progress",
        id: assignmentId,
        percent: 20,
        stage: "prompting",
      });

      const input = await AssignmentService.toGenerationInput(doc);
      emitToAssignment(assignmentId, {
        type: "assignment.progress",
        id: assignmentId,
        percent: 40,
        stage: "calling-llm",
      });

      const paper = await adapter.generatePaper(input);

      emitToAssignment(assignmentId, {
        type: "assignment.progress",
        id: assignmentId,
        percent: 90,
        stage: "saving",
      });
      const readyDoc = await AssignmentService.markReady(assignmentId, paper, {
        source: "ai",
        note: input.regenerationInstructions,
      });

      emitToAssignment(assignmentId, {
        type: "assignment.ready",
        id: assignmentId,
        paper,
        assignment: readyDoc.toObject({ versionKey: false }) as never,
      });
      logger.info({ assignmentId, jobId: job.id }, "generation ready");
    },
    { connection: bullConnection(), concurrency: 2 }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    logger.error({ err, jobId: job.id }, "generation job failed");
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const assignmentId = job.data.assignmentId;
      await AssignmentService.markFailed(assignmentId, err.message);
      emitToAssignment(assignmentId, {
        type: "assignment.failed",
        id: assignmentId,
        error: err.message,
      });
    }
  });

  worker.on("error", (err) => logger.error({ err }, "generation worker error"));
  return worker;
}
