import type { QuestionPaper } from "@/types/assignment";
import { DifficultyTag } from "./difficulty-tag";

interface QuestionPaperViewProps {
  paper: QuestionPaper;
}

/**
 * Renders a generated paper using clean, exam-style typography.
 * Structured into:
 *   - School header (centered)
 *   - Meta row (time / marks)
 *   - Student info blanks
 *   - Sections → numbered question list with difficulty tags + marks
 *   - Answer key
 *
 * The layout is deliberately printable: A4-friendly max-width, ample
 * leading, and no decorative chrome inside the content frame.
 */
export function QuestionPaperView({ paper }: QuestionPaperViewProps) {
  return (
    <article className="mx-auto w-full max-w-3xl rounded-2xl bg-surface px-5 py-8 text-[14px] leading-7 text-ink sm:px-10 sm:py-10 print:px-0 print:py-0 print:shadow-none">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-[20px] font-bold">{paper.schoolName}</h1>
        <p className="mt-1">Subject: {paper.subject}</p>
        <p>Class: {paper.className}</p>
      </header>

      {/* Meta */}
      <div className="mt-6 flex items-start justify-between">
        <span>Time Allowed: {paper.timeAllowedMinutes} minutes</span>
        <span>Maximum Marks: {paper.maximumMarks}</span>
      </div>

      <p className="mt-5 font-semibold">
        All questions are compulsory unless stated otherwise.
      </p>

      {/* Student info */}
      <div className="mt-5 space-y-1.5">
        <StudentField label="Name" widthCh={22} />
        <StudentField label="Roll Number" widthCh={18} />
        <StudentField label="Section" widthCh={14} />
      </div>

      {/* Sections */}
      {paper.sections.map((section) => (
        <section key={section.id} className="mt-8">
          <h2 className="text-center text-[16px] font-bold">{section.title}</h2>

          <div className="mt-4">
            <h3 className="font-bold">{section.heading}</h3>
            <p className="italic text-ink-muted">{section.instruction}</p>
          </div>

          <ol className="mt-3 list-decimal space-y-2 pl-6">
            {section.questions.map((q) => (
              <li key={q.id} className="pl-1">
                <DifficultyTag level={q.difficulty} /> {q.text}{" "}
                <span className="whitespace-nowrap">[{q.marks} Marks]</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <p className="mt-6 font-bold">End of Question Paper</p>

      {/* Answer key */}
      {paper.answerKey.length > 0 && (
        <section className="mt-10">
          <h2 className="font-bold">Answer Key:</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-6">
            {paper.answerKey.map((a) => (
              <li key={a.questionId} className="whitespace-pre-line pl-1">
                {a.answer}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

function StudentField({ label, widthCh }: { label: string; widthCh: number }) {
  return (
    <div className="flex items-center gap-2">
      <span>{label}:</span>
      <span
        className="border-b border-ink"
        style={{ width: `${widthCh}ch`, display: "inline-block", height: "1em" }}
        aria-hidden="true"
      />
    </div>
  );
}
