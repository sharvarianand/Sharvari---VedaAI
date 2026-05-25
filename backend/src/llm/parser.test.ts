import { describe, it, expect } from "vitest";
import { extractJson, parsePaper } from "./parser.js";
import { LlmGenerationError } from "./types.js";

const VALID_PAPER = {
  schoolName: "DPS",
  subject: "Science",
  className: "5th",
  timeAllowedMinutes: 45,
  maximumMarks: 10,
  sections: [
    {
      id: "s1",
      title: "Section A",
      heading: "Short Answers",
      instruction: "Attempt all",
      questions: [
        { id: "q1", text: "What is water?", difficulty: "easy", marks: 5 },
        { id: "q2", text: "Define ion.", difficulty: "moderate", marks: 5 },
      ],
    },
  ],
  answerKey: [
    { questionId: "q1", answer: "H2O" },
    { questionId: "q2", answer: "Charged particle" },
  ],
};

describe("extractJson", () => {
  it("returns the input when already valid JSON", () => {
    const json = JSON.stringify(VALID_PAPER);
    expect(extractJson(json)).toBe(json);
  });

  it("strips ```json fences", () => {
    const wrapped = "```json\n" + JSON.stringify(VALID_PAPER) + "\n```";
    expect(extractJson(wrapped)).toBe(JSON.stringify(VALID_PAPER));
  });

  it("strips bare ``` fences", () => {
    const wrapped = "```\n" + JSON.stringify(VALID_PAPER) + "\n```";
    expect(extractJson(wrapped)).toBe(JSON.stringify(VALID_PAPER));
  });

  it("recovers JSON from a chatty preamble", () => {
    const chatty = `Sure, here's the paper:\n${JSON.stringify(VALID_PAPER)}`;
    const cleaned = extractJson(chatty);
    expect(JSON.parse(cleaned)).toEqual(VALID_PAPER);
  });
});

describe("parsePaper", () => {
  it("accepts a well-formed paper", () => {
    const out = parsePaper(JSON.stringify(VALID_PAPER));
    expect(out.sections[0].questions).toHaveLength(2);
    expect(out.maximumMarks).toBe(10);
  });

  it("throws when JSON is malformed", () => {
    expect(() => parsePaper("not json at all")).toThrow(LlmGenerationError);
  });

  it("throws when shape is invalid", () => {
    const bad = { ...VALID_PAPER, sections: [] };
    expect(() => parsePaper(JSON.stringify(bad))).toThrow(LlmGenerationError);
  });

  it("rejects out-of-range difficulty", () => {
    const bad = JSON.parse(JSON.stringify(VALID_PAPER));
    bad.sections[0].questions[0].difficulty = "very-hard";
    expect(() => parsePaper(JSON.stringify(bad))).toThrow(LlmGenerationError);
  });
});
