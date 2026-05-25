import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt.js";

describe("buildPrompt", () => {
  it("includes counts, marks, and totals in the user prompt", () => {
    const { user } = buildPrompt({
      dueDate: "2025-07-01",
      schoolName: "DPS",
      subject: "Science",
      className: "5th",
      additionalInstructions: "Focus on practical examples.",
      questionTypes: [
        { type: "mcq", count: 4, marksPerQuestion: 1 },
        { type: "short", count: 3, marksPerQuestion: 2 },
      ],
    });
    expect(user).toMatch(/Total questions: 7/);
    expect(user).toMatch(/Total marks: 10/);
    expect(user).toMatch(/4 × Multiple Choice/);
    expect(user).toMatch(/3 × Short Answer/);
    expect(user).toMatch(/Focus on practical examples/);
  });

  it("notes when no material was uploaded", () => {
    const { user } = buildPrompt({
      dueDate: "2025-07-01",
      schoolName: "DPS",
      subject: "Math",
      className: "8th",
      additionalInstructions: "",
      questionTypes: [{ type: "numerical", count: 2, marksPerQuestion: 5 }],
    });
    expect(user).toMatch(/No reference material/);
  });

  it("references the uploaded filename when material is present", () => {
    const { user } = buildPrompt({
      dueDate: "2025-07-01",
      schoolName: "DPS",
      subject: "Math",
      className: "8th",
      additionalInstructions: "",
      questionTypes: [{ type: "long", count: 1, marksPerQuestion: 5 }],
      material: {
        name: "ch-electricity.pdf",
        size: 200,
        mime: "application/pdf",
        extractedText: "Current, circuit, resistance, and cells are the focus topics.",
      },
    });
    expect(user).toMatch(/ch-electricity\.pdf/);
    expect(user).toMatch(/Current, circuit, resistance/);
  });

  it("includes regenerate instructions when provided", () => {
    const { user } = buildPrompt({
      dueDate: "2025-07-01",
      schoolName: "DPS",
      subject: "Math",
      className: "8th",
      additionalInstructions: "",
      regenerationInstructions: "Make section B harder and reduce MCQs.",
      questionTypes: [{ type: "long", count: 1, marksPerQuestion: 5 }],
    });
    expect(user).toMatch(/Revision instructions/);
    expect(user).toMatch(/Make section B harder/);
  });
});
