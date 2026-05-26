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
        percent: 10,
        stage: "reading-material",
      });

      const input = await AssignmentService.toGenerationInput(doc);
      emitToAssignment(assignmentId, {
        type: "assignment.progress",
        id: assignmentId,
        percent: 25,
        stage: "prompting",
      });

      emitToAssignment(assignmentId, {
        type: "assignment.progress",
        id: assignmentId,
        percent: 55,
        stage: "calling-llm",
      });

      let { paper, variantPaper } = await adapter.generatePaper(input);

      // Programmatic Question Locking
      // If the LLM didn't perfectly reproduce the locked questions (or changed their IDs),
      // we forcefully inject them back into the new paper.
      const { lockedQuestionIds } = job.data;
      if (lockedQuestionIds && lockedQuestionIds.length > 0 && doc.paper) {
        const lockedQs: any[] = [];
        const lockedAns = new Map<string, string>();
        
        // Extract locked from old paper
        for (const sec of doc.paper.sections) {
          for (const q of sec.questions) {
            if (lockedQuestionIds.includes(q.id)) {
              lockedQs.push({ ...q });
              const ans = doc.paper.answerKey.find((a: any) => a.questionId === q.id);
              if (ans) lockedAns.set(q.id, ans.answer);
            }
          }
        }
        
        // Inject into new paper sequentially
        let lockedIdx = 0;
        for (const sec of paper.sections) {
          for (let i = 0; i < sec.questions.length; i++) {
            if (lockedIdx < lockedQs.length) {
              const oldId = sec.questions[i].id;
              const lockedQ = lockedQs[lockedIdx];
              sec.questions[i] = lockedQ;
              
              // update answer key
              const aIdx = paper.answerKey.findIndex((a: any) => a.questionId === oldId);
              if (aIdx >= 0) {
                paper.answerKey[aIdx] = {
                  questionId: lockedQ.id,
                  answer: lockedAns.get(lockedQ.id) || "Answer missing",
                };
              } else {
                paper.answerKey.push({
                  questionId: lockedQ.id,
                  answer: lockedAns.get(lockedQ.id) || "Answer missing",
                });
              }
              lockedIdx++;
            }
          }
        }
      }

      emitToAssignment(assignmentId, {
        type: "assignment.progress",
        id: assignmentId,
        percent: 80,
        stage: "structuring",
      });

      emitToAssignment(assignmentId, {
        type: "assignment.progress",
        id: assignmentId,
        percent: 95,
        stage: "saving",
      });

      // For variant generation, the adapter may return a combined response
      // but in practice the mock/real adapters return a single paper.
      // The variant paper is handled if the input requests it and we detect
      // a dual-paper format (future: the adapter could return { setA, setB }).
      const readyDoc = await AssignmentService.markReady(assignmentId, paper, {
        source: "ai",
        note: input.regenerationInstructions,
        variantPaper,
      });

      emitToAssignment(assignmentId, {
        type: "assignment.ready",
        id: assignmentId,
        paper,
        variantPaper,
        assignment: readyDoc.toObject({ versionKey: false }) as never,
      });
      logger.info({ assignmentId, jobId: job.id }, "generation ready");
    },
    { connection: bullConnection(), concurrency: 4 }
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
