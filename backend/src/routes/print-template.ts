import type { QuestionPaper } from "../llm/types.js";

interface AssignmentLite {
  _id: string;
  title: string;
  paper?: QuestionPaper;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  moderate: "Medium",
  hard: "Hard",
};

function formatQuestionText(text: string): string {
  return text.replace(/\s+\(([A-D])\)\s+/g, "<br/>($1) ");
}

/** Cheap, dependency-free HTML escape for user-controlled strings. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Self-contained HTML page used by Puppeteer for PDF generation.
 *
 * Mirrors the on-screen layout in `frontend/src/components/assignments/question-paper.tsx`
 * but rendered server-side so the worker doesn't depend on a running
 * frontend instance.
 */
export function renderPaperHtml(doc: AssignmentLite): string {
  const paper = doc.paper;
  if (!paper) return "<!doctype html><title>Not ready</title>";
  const difficultyCounts = paper.sections
    .flatMap((section) => section.questions)
    .reduce(
      (acc, question) => {
        acc[question.difficulty] = (acc[question.difficulty] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  const sectionsHtml = paper.sections
    .map(
      (s) => `
        <section class="section">
          <h2 class="section-title">${esc(s.title)}</h2>
          <h3 class="section-heading">${esc(s.heading)}</h3>
          <p class="section-instruction">${esc(s.instruction)}</p>
          <ol class="questions">
            ${s.questions
              .map(
                (q) => `
                  <li>
                    <span class="diff diff-${q.difficulty}">[${esc(
                      DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty
                    )}]</span>
                    ${formatQuestionText(esc(q.text))}
                    <span class="marks">[${q.marks} Marks]</span>
                  </li>`
              )
              .join("")}
          </ol>
        </section>`
    )
    .join("");

  const answerKeyHtml = paper.answerKey.length
    ? `
      <section class="answer-key">
        <h2>Answer Key:</h2>
        <ol>${paper.answerKey
          .map((a) => `<li>${esc(a.answer)}</li>`)
          .join("")}</ol>
      </section>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(doc.title)}</title>
  <style>
    @page { size: A4; margin: 20mm 16mm; }
    * { box-sizing: border-box; }
    html, body { padding: 0; margin: 0; }
    body {
      font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      font-size: 12pt;
      line-height: 1.55;
    }
    header.school { text-align: center; margin-bottom: 14pt; }
    header.school h1 {
      margin: 0; font-size: 16pt; font-weight: 700;
    }
    header.school p { margin: 2pt 0; font-size: 11pt; }
    .meta {
      display: flex; justify-content: space-between;
      font-weight: 500; margin-top: 8pt;
    }
    .difficulty-row {
      display: flex; flex-wrap: wrap; gap: 8pt;
      align-items: center; margin-top: 10pt; font-size: 10.5pt; color: #666;
    }
    .compulsory { font-weight: 600; margin-top: 14pt; }
    .student-info p { margin: 4pt 0; }
    .student-info .blank {
      display: inline-block; min-width: 18ch; border-bottom: 1px solid #1a1a1a;
    }
    .section { margin-top: 18pt; page-break-inside: avoid; }
    .section-title { text-align: center; font-size: 13pt; font-weight: 700; margin: 0 0 8pt; }
    .section-heading { margin: 0; font-weight: 700; font-size: 12pt; }
    .section-instruction { margin: 2pt 0 8pt; font-style: italic; color: #555; }
    ol.questions { padding-left: 18pt; }
    ol.questions li { margin-bottom: 8pt; }
    .marks { white-space: nowrap; }
    .diff { font-weight: 700; margin-right: 4pt; }
    .diff-badge {
      display: inline-block;
      padding: 2pt 8pt;
      border-radius: 999px;
      border: 1px solid currentColor;
      font-weight: 700;
    }
    .diff-easy { color: #047857; }
    .diff-moderate { color: #b45309; }
    .diff-hard { color: #be123c; }
    .end {
      margin-top: 18pt; font-weight: 700;
    }
    .answer-key { margin-top: 22pt; page-break-before: always; }
    .answer-key h2 { font-size: 13pt; margin-bottom: 8pt; }
    .answer-key ol { padding-left: 18pt; }
    .answer-key li { margin-bottom: 6pt; white-space: pre-line; }
  </style>
</head>
<body>
  <header class="school">
    <h1>${esc(paper.schoolName)}</h1>
    <p>Subject: ${esc(paper.subject)}</p>
    <p>Class: ${esc(paper.className)}</p>
  </header>

  <div class="meta">
    <span>Time Allowed: ${paper.timeAllowedMinutes} minutes</span>
    <span>Maximum Marks: ${paper.maximumMarks}</span>
  </div>

  <div class="difficulty-row">
    <span class="diff-badge diff-easy">Easy</span>
    <span>${difficultyCounts.easy ?? 0} questions</span>
    <span class="diff-badge diff-moderate">Medium</span>
    <span>${difficultyCounts.moderate ?? 0} questions</span>
    <span class="diff-badge diff-hard">Hard</span>
    <span>${difficultyCounts.hard ?? 0} questions</span>
  </div>

  <p class="compulsory">All questions are compulsory unless stated otherwise.</p>

  <div class="student-info">
    <p>Name: <span class="blank"></span></p>
    <p>Roll Number: <span class="blank"></span></p>
    <p>Class: ${esc(paper.className)} &nbsp; Section: <span class="blank"></span></p>
  </div>

  ${sectionsHtml}

  <p class="end">End of Question Paper</p>

  ${answerKeyHtml}
</body>
</html>`;
}
