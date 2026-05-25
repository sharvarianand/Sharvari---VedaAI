import { describe, it, expect } from "vitest";
import { MockLlmAdapter } from "./mock.js";
import { QuestionPaperSchema, type GenerationInput } from "../types.js";

const baseInput: GenerationInput = {
  dueDate: "2025-06-21",
  schoolName: "Delhi Public School",
  subject: "Science",
  className: "5th",
  additionalInstructions: "",
  language: "english",
  generateVariants: false,
  questionTypes: [
    { type: "mcq", count: 4, marksPerQuestion: 1 },
    { type: "short", count: 3, marksPerQuestion: 2 },
  ],
};

describe("MockLlmAdapter", () => {
  it("produces a paper that satisfies the public schema", async () => {
    const adapter = new MockLlmAdapter();
    const { paper } = await adapter.generatePaper(baseInput);
    expect(() => QuestionPaperSchema.parse(paper)).not.toThrow();
  });

  it("respects the requested counts and marks", async () => {
    const adapter = new MockLlmAdapter();
    const { paper } = await adapter.generatePaper(baseInput);
    expect(paper.sections).toHaveLength(2);
    expect(paper.sections[0].questions).toHaveLength(4);
    expect(paper.sections[1].questions).toHaveLength(3);
    // 4*1 + 3*2 = 10
    expect(paper.maximumMarks).toBe(10);
  });

  it("emits one answer per question with matching ids", async () => {
    const adapter = new MockLlmAdapter();
    const { paper } = await adapter.generatePaper(baseInput);
    const allQuestionIds = paper.sections.flatMap((s) => s.questions.map((q) => q.id));
    const answerIds = paper.answerKey.map((a) => a.questionId);
    expect(answerIds.sort()).toEqual(allQuestionIds.sort());
  });

  it("gives a sensible time allowance", async () => {
    const adapter = new MockLlmAdapter();
    const { paper } = await adapter.generatePaper(baseInput);
    expect(paper.timeAllowedMinutes).toBeGreaterThanOrEqual(20);
    expect(paper.timeAllowedMinutes).toBeLessThanOrEqual(180);
  });
});
