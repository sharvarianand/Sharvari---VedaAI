import type { QuestionPaper } from "@/types/assignment";
import { DifficultyTag } from "./difficulty-tag";

interface QuestionPaperViewProps {
  paper: QuestionPaper;
  lockedQuestionIds?: Set<string>;
  onToggleLock?: (id: string) => void;
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
export function QuestionPaperView({ paper, lockedQuestionIds, onToggleLock }: QuestionPaperViewProps) {
  const difficultyCounts = paper.sections
    .flatMap((section) => section.questions)
    .reduce(
      (acc, question) => {
        acc[question.difficulty] += 1;
        return acc;
      },
      { easy: 0, moderate: 0, hard: 0 }
    );

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

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
        <DifficultyTag level="easy" className="print:border print:bg-transparent" />
        <span>{difficultyCounts.easy} questions</span>
        <DifficultyTag
          level="moderate"
          className="print:border print:bg-transparent"
        />
        <span>{difficultyCounts.moderate} questions</span>
        <DifficultyTag level="hard" className="print:border print:bg-transparent" />
        <span>{difficultyCounts.hard} questions</span>
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
            {section.questions.map((q) => {
              const isLocked = lockedQuestionIds?.has(q.id) ?? false;
              return (
                <li key={q.id} className="pl-1 group relative">
                  <DifficultyTag
                    level={q.difficulty}
                    className="print:border print:bg-transparent"
                  />{" "}
                  <span className="whitespace-pre-line">{formatQuestionText(q.text)}</span>{" "}
                  <span className="whitespace-nowrap">[{q.marks} Marks]</span>
                  {onToggleLock && (
                    <button
                      onClick={() => onToggleLock(q.id)}
                      className={`ml-2 inline-flex items-center justify-center rounded p-1 transition-colors print:hidden ${
                        isLocked ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "text-ink-muted hover:bg-surface-muted opacity-0 group-hover:opacity-100"
                      }`}
                      title={isLocked ? "Unlock Question" : "Lock Question (Keep unchanged on regenerate)"}
                    >
                      {isLocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <p className="mt-6 font-bold">End of Question Paper</p>

      {/* Answer key */}
      {paper.answerKey.length > 0 && (
        <section className="mt-10 print:break-before-page">
          <h2 className="font-bold">Answer Key:</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-6">
            {paper.answerKey.map((a) => (
              <li key={a.questionId} className="whitespace-pre-line pl-1">
                {a.answer.replace(/\\n/g, '\n')}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

function formatQuestionText(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\s+\(([A-D])\)\s+/g, "\n($1) ");
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
