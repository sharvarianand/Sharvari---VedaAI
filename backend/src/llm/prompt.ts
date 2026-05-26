import type { GenerationInput } from "./types.js";

/**
 * Human-readable label for a question-type key, used inside the prompt
 * so the model gets a clear instruction rather than a slug.
 */
const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple Choice Questions (each with 4 options labelled A-D)",
  short: "Short Answer Questions (1-3 sentences)",
  long: "Long Answer Questions (a full paragraph)",
  diagram: "Diagram / Graph-Based Questions (describe the diagram in words)",
  numerical: "Numerical Problems (with clear numeric setup)",
  "true-false": "True / False statements",
  "fill-blanks": "Fill in the Blanks (use ____ for the blank)",
};

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  english: "Generate the entire paper in English.",
  hindi: "Generate the entire paper in Hindi (Devanagari script).",
  bilingual:
    "Generate the paper bilingually: write each question and answer in both English and Hindi (Devanagari script), with English first followed by Hindi translation.",
};

/**
 * Build the system + user prompt pair for a generation request.
 *
 * The contract demanded from the model is intentionally rigid: a single JSON
 * object that conforms to the published schema. We restate the difficulty
 * distribution in plain English to avoid a uniform-difficulty bias and
 * include a worked example structure as a few-shot anchor.
 */
export function buildPrompt(input: GenerationInput): {
  system: string;
  user: string;
} {
  const totalQuestions = input.questionTypes.reduce((s, q) => s + q.count, 0);
  const totalMarks = input.questionTypes.reduce(
    (s, q) => s + q.count * q.marksPerQuestion,
    0
  );

  const typeLines = input.questionTypes
    .map(
      (q) =>
        `- ${q.count} × ${TYPE_LABEL[q.type] ?? q.type} (${q.marksPerQuestion} mark${
          q.marksPerQuestion === 1 ? "" : "s"
        } each)`
    )
    .join("\n");

  const hasMaterial = !!input.material;
  const hasExtractedText = !!input.material?.extractedText?.trim();
  const materialLine = hasMaterial
    ? `A reference document was uploaded: "${input.material!.name}" (${input.material!.mime}). Treat its filename and any title hints as the chapter focus.`
    : `No reference material was uploaded — pick a representative chapter for the subject.`;
  const materialExcerptLine = hasExtractedText
    ? `===== STUDY MATERIAL (AUTHORITATIVE SOURCE) =====
${input.material!.extractedText!.trim()}
===== END STUDY MATERIAL =====

CRITICAL GROUNDING RULES (must follow when study material is provided):
1. Every question you generate MUST be derived strictly from the facts, concepts, examples, names, numbers, definitions, formulas, and topics that appear in the STUDY MATERIAL above. Do NOT invent unrelated questions or pull from outside knowledge.
2. Quote or paraphrase specifics from the material (terms, dates, characters, formulas, processes mentioned in the text). If a number, name, or definition is in the material, prefer using it in the question.
3. For MCQs, the correct answer must be explicitly supported by the material. Distractors should be plausible but clearly wrong against the material.
4. For fill-in-the-blanks, the blank must correspond to a term/phrase that actually appears in the material.
5. For numerical problems, reuse formulas/values from the material whenever possible.
6. For long/short answers, the model answer in the answerKey must be consistent with the material's content.
7. Do NOT generate questions about topics that are not covered in the STUDY MATERIAL excerpt, even if they are common for this subject/class.
8. If the material is too short or noisy to cover a requested question count, stay strictly within what the material supports and rephrase/expand around the same content rather than inventing new topics.`
    : hasMaterial
      ? `A material file was uploaded but no readable text could be extracted from it (it may be an image, scan, or encrypted PDF). The teacher EXPECTS the paper to be based on this file. Use the filename ("${input.material!.name}") as a strong topical hint and stay tightly on that chapter/topic — do NOT drift into unrelated parts of the subject.`
      : `No material excerpt could be extracted, so rely on the requested subject, class, and teacher instructions.`;
  const regenerationLine = input.regenerationInstructions?.trim()
    ? `Revision instructions for this regeneration:\n${input.regenerationInstructions.trim()}`
    : `No revision-specific instructions were provided.`;
  const languageLine = LANGUAGE_INSTRUCTION[input.language] ?? LANGUAGE_INSTRUCTION.english;

  const system = [
    "You are an experienced school teacher generating a fair, exam-quality question paper.",
    "Output MUST be a single JSON object that strictly conforms to the schema described below.",
    "Do not include markdown, prose, or commentary outside the JSON.",
    "Generate a fresh paper each time; do not reuse the same wording or question order from earlier attempts.",
    "If a STUDY MATERIAL block is provided in the user message, every question and answer MUST be derived from that material. Treat it as the single source of truth and do not introduce outside topics.",
    "Distribute difficulty roughly as 30% easy, 50% moderate, 20% hard.",
    "Group questions into at least one section (Section A, B, ...). Use multiple sections when more than one question type is requested.",
    "Each question must have a unique id (q1, q2, q3, ...) and the answerKey must reference those ids.",
    "For MCQs, put each option on a new line inside the question text, labelled (A), (B), (C), and (D).",
    "Be concise and respond with ONLY the JSON object. No extra text.",
  ].join(" ");

  const user = `Generate a question paper with the following parameters.

Subject: ${input.subject}
Class: ${input.className}
School: ${input.schoolName}
Due date: ${input.dueDate}
Total questions: ${totalQuestions}
Total marks: ${totalMarks}

Question type breakdown:
${typeLines}

${materialLine}
${materialExcerptLine}

${regenerationLine}

Language: ${languageLine}

Additional instructions from the teacher:
${input.additionalInstructions || "(none)"}

Formatting requirements:
- The paper must be clean and readable.
- MCQ options must appear on separate lines.
- If regeneration instructions are present, apply them concretely instead of ignoring them.

Return JSON of the shape:
{
  "schoolName": string,
  "subject": string,
  "className": string,
  "timeAllowedMinutes": number,
  "maximumMarks": number,
  "sections": [
    {
      "id": string,
      "title": string,            // e.g. "Section A"
      "heading": string,          // e.g. "Short Answer Questions"
      "instruction": string,      // e.g. "Attempt all questions. Each question carries 2 marks"
      "questions": [
        { "id": string, "text": string, "difficulty": "easy"|"moderate"|"hard", "marks": number }
      ]
    }
  ],
  "answerKey": [ { "questionId": string, "answer": string } ]
}

Make sure maximumMarks equals the sum of marks across all questions and that
every question id appears exactly once in the answerKey.`;

  return { system, user };
}

/**
 * Build a prompt for A/B variant generation. Returns the same schema but
 * with instructions to create a second variant (Set B) with different questions
 * at the same difficulty distribution.
 */
export function buildVariantPrompt(input: GenerationInput): {
  system: string;
  user: string;
} {
  const base = buildPrompt(input);
  const variantUser = `${base.user}

IMPORTANT ADDITIONAL REQUIREMENT — A/B VARIANT GENERATION:
Generate TWO distinct variants (Set A and Set B) of this paper.
- Both sets must have the SAME difficulty distribution, SAME number of questions, SAME total marks, and SAME section structure.
- But Set B must have COMPLETELY DIFFERENT questions (different wording, different problems, different scenarios).
- This is to prevent copying during examinations in Indian schools.

Return a JSON object with this shape:
{
  "setA": { ...QuestionPaper },
  "setB": { ...QuestionPaper }
}

Where each QuestionPaper follows the exact schema described above.
Set A's title should include "(Set A)" and Set B should include "(Set B)" in the section headings.`;

  return { system: base.system, user: variantUser };
}

