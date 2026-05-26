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
      const matLen = input.material?.extractedText?.length ?? 0;
      logger.info(
        { assignmentId, materialName: input.material?.name, extractedTextLength: matLen },
        matLen > 0
          ? "material extracted successfully for grounding"
          : input.material?.name
            ? "material uploaded but no usable text could be extracted"
            : "no material uploaded"
      );
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
      // If the LLM didn't perfectly reproduce the locked questions (or changed
      // their IDs), forcefully inject them back into the SAME section and
      // position they originally occupied in the old paper. We keep their
      // original IDs, and rebuild the answerKey so there are no duplicates and
      // no orphan entries for displaced questions.
      const { lockedQuestionIds } = job.data;
      if (lockedQuestionIds && lockedQuestionIds.length > 0 && doc.paper) {
        type LockedInfo = {
          sIdx: number;
          qIdx: number;
          question: any;
          answer: string;
        };
        const lockedInfos: LockedInfo[] = [];

        // Step 1: Capture each locked question's original (section, index, body, answer).
        for (let s = 0; s < doc.paper.sections.length; s += 1) {
          const sec = doc.paper.sections[s];
          for (let q = 0; q < sec.questions.length; q += 1) {
            const question = sec.questions[q];
            if (lockedQuestionIds.includes(question.id)) {
              const ans = doc.paper.answerKey.find(
                (a: any) => a.questionId === question.id
              );
              lockedInfos.push({
                sIdx: s,
                qIdx: q,
                question: { ...question },
                answer: ans?.answer ?? "Answer missing",
              });
            }
          }
        }

        if (lockedInfos.length > 0) {
          const lockedIdSet = new Set(lockedInfos.map((l) => l.question.id));

          // Step 2: For each locked question, place it at the same section
          // and slot in the new paper, displacing whatever the LLM put there.
          // If the new paper has fewer sections/slots than the old one, fall
          // back to appending at the closest available slot in the new paper.
          for (const info of lockedInfos) {
            let newSec = paper.sections[info.sIdx];
            // If the section index doesn't exist anymore (e.g. LLM merged sections),
            // pick the last available section as fallback.
            if (!newSec) {
              newSec = paper.sections[paper.sections.length - 1];
              if (!newSec) continue;
            }

            if (info.qIdx < newSec.questions.length) {
              // Replace whatever question is at that slot.
              const displaced = newSec.questions[info.qIdx];
              if (!lockedIdSet.has(displaced.id)) {
                // Drop the displaced question's answerKey entry so we don't
                // leave an orphan referencing a question that no longer exists.
                const dispAnsIdx = paper.answerKey.findIndex(
                  (a: any) => a.questionId === displaced.id
                );
                if (dispAnsIdx >= 0) paper.answerKey.splice(dispAnsIdx, 1);
              }
              newSec.questions[info.qIdx] = { ...info.question };
            } else {
              // Slot index is out of range — append to the end of the section.
              newSec.questions.push({ ...info.question });
            }

            // Ensure exactly one answerKey entry for the locked question.
            const existingLockedAnsIdx = paper.answerKey.findIndex(
              (a: any) => a.questionId === info.question.id
            );
            if (existingLockedAnsIdx >= 0) {
              paper.answerKey[existingLockedAnsIdx] = {
                questionId: info.question.id,
                answer: info.answer,
              };
            } else {
              paper.answerKey.push({
                questionId: info.question.id,
                answer: info.answer,
              });
            }
          }

          // Step 3: De-duplicate any questions that may now share an ID
          // (very rare — only if the LLM coincidentally reused a locked ID
          // somewhere else in the paper). Keep the locked occurrence.
          const seenIds = new Set<string>();
          for (const sec of paper.sections) {
            const kept: any[] = [];
            for (const q of sec.questions) {
              if (seenIds.has(q.id)) {
                // Skip duplicate
                continue;
              }
              seenIds.add(q.id);
              kept.push(q);
            }
            sec.questions = kept;
          }

          // Step 4: Text-level dedup. Some LLMs ignore the "do not repeat
          // the locked questions" instruction and re-emit a paraphrase of
          // the locked question elsewhere. Remove any non-locked question
          // whose normalised text matches a locked one.
          const normalise = (s: string): string =>
            s
              .toLowerCase()
              .replace(/\s+/g, " ")
              .replace(/[^a-z0-9 ]/g, "")
              .trim();
          const lockedNormSet = new Set(
            lockedInfos.map((l) => normalise(l.question.text))
          );
          // Prefix-match for short stems (>= 40 chars) so paraphrases that
          // share a long opening still count as duplicates.
          const lockedPrefixes = lockedInfos
            .map((l) => normalise(l.question.text))
            .filter((t) => t.length >= 40)
            .map((t) => t.slice(0, 40));
          for (const sec of paper.sections) {
            sec.questions = sec.questions.filter((q: any) => {
              if (lockedIdSet.has(q.id)) return true; // never drop the locked one
              const norm = normalise(q.text);
              if (lockedNormSet.has(norm)) return false;
              if (lockedPrefixes.some((p) => norm.startsWith(p))) return false;
              return true;
            });
          }

          // Step 5: Prune answerKey entries that no longer have a matching question.
          const allQuestionIds = new Set<string>();
          for (const sec of paper.sections) {
            for (const q of sec.questions) allQuestionIds.add(q.id);
          }
          paper.answerKey = paper.answerKey.filter((a: any) =>
            allQuestionIds.has(a.questionId)
          );
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
