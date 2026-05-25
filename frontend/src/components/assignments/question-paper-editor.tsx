"use client";

import type { ChangeEvent } from "react";
import { SelectPill } from "@/components/ui/select-pill";
import type { Difficulty, QuestionPaper } from "@/types/assignment";

interface QuestionPaperEditorProps {
  title: string;
  onTitleChange: (value: string) => void;
  paper: QuestionPaper;
  onChange: (paper: QuestionPaper) => void;
  saveNote: string;
  onSaveNoteChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
];

function withMaximumMarks(paper: QuestionPaper): QuestionPaper {
  const maximumMarks = paper.sections.reduce(
    (sectionSum, section) =>
      sectionSum +
      section.questions.reduce(
        (questionSum, question) => questionSum + question.marks,
        0
      ),
    0
  );

  return { ...paper, maximumMarks };
}

export function QuestionPaperEditor({
  title,
  onTitleChange,
  paper,
  onChange,
  saveNote,
  onSaveNoteChange,
  onSave,
  onCancel,
  saving = false,
}: QuestionPaperEditorProps) {
  const setPaper = (next: QuestionPaper) => onChange(withMaximumMarks(next));

  const updatePaperField = (
    field: "schoolName" | "subject" | "className",
    value: string
  ) => {
    setPaper({ ...paper, [field]: value });
  };

  const updateMinutes = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    const next = Number.isFinite(value) ? Math.max(5, Math.min(360, value)) : 5;
    setPaper({ ...paper, timeAllowedMinutes: next });
  };

  const updateSectionField = (
    sectionIndex: number,
    field: "title" | "heading" | "instruction",
    value: string
  ) => {
    setPaper({
      ...paper,
      sections: paper.sections.map((section, index) =>
        index === sectionIndex ? { ...section, [field]: value } : section
      ),
    });
  };

  const updateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    patch: Partial<QuestionPaper["sections"][number]["questions"][number]>
  ) => {
    setPaper({
      ...paper,
      sections: paper.sections.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, qIdx) =>
                qIdx === questionIndex ? { ...question, ...patch } : question
              ),
            }
          : section
      ),
    });
  };

  const updateAnswer = (index: number, answer: string) => {
    setPaper({
      ...paper,
      answerKey: paper.answerKey.map((item, itemIndex) =>
        itemIndex === index ? { ...item, answer } : item
      ),
    });
  };

  return (
    <div className="card-elevated rounded-3xl bg-surface p-5 sm:p-7 print:hidden">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Edit Question Paper</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Update content before finalizing. Saving creates a new version.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Paper Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-[14px] text-ink focus:outline-none"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <EditorField
            label="School Name"
            value={paper.schoolName}
            onChange={(value) => updatePaperField("schoolName", value)}
          />
          <EditorField
            label="Subject"
            value={paper.subject}
            onChange={(value) => updatePaperField("subject", value)}
          />
          <EditorField
            label="Class"
            value={paper.className}
            onChange={(value) => updatePaperField("className", value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-ink">
              Time Allowed (minutes)
            </span>
            <input
              type="number"
              min={5}
              max={360}
              value={paper.timeAllowedMinutes}
              onChange={updateMinutes}
              className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-[14px] text-ink focus:outline-none"
            />
          </label>
          <div className="rounded-2xl border border-line bg-surface-muted px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">Maximum Marks</p>
            <p className="mt-1 text-[15px] text-ink">{paper.maximumMarks}</p>
            <p className="mt-1 text-[12px] text-ink-muted">
              Auto-calculated from question marks.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {paper.sections.map((section, sectionIndex) => (
          <section
            key={section.id}
            className="rounded-3xl border border-line bg-surface-muted p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <EditorField
                label="Section Title"
                value={section.title}
                onChange={(value) =>
                  updateSectionField(sectionIndex, "title", value)
                }
              />
              <EditorField
                label="Section Heading"
                value={section.heading}
                onChange={(value) =>
                  updateSectionField(sectionIndex, "heading", value)
                }
              />
            </div>
            <label className="mt-3 flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-ink">Instruction</span>
              <textarea
                value={section.instruction}
                onChange={(event) =>
                  updateSectionField(sectionIndex, "instruction", event.target.value)
                }
                rows={2}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-[14px] text-ink focus:outline-none"
              />
            </label>

            <div className="mt-4 space-y-4">
              {section.questions.map((question, questionIndex) => (
                <div key={question.id} className="rounded-2xl bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      {question.id}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <SelectPill
                        value={question.difficulty}
                        onChange={(value) =>
                          updateQuestion(sectionIndex, questionIndex, {
                            difficulty: value as Difficulty,
                          })
                        }
                        options={DIFFICULTY_OPTIONS}
                        ariaLabel="Difficulty"
                        className="min-w-[150px]"
                      />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={question.marks}
                        onChange={(event) =>
                          updateQuestion(sectionIndex, questionIndex, {
                            marks: Number(event.target.value) || 1,
                          })
                        }
                        className="w-24 rounded-full border border-line bg-surface-muted px-4 py-2 text-[14px] text-ink focus:outline-none"
                      />
                    </div>
                  </div>
                  <textarea
                    value={question.text}
                    onChange={(event) =>
                      updateQuestion(sectionIndex, questionIndex, {
                        text: event.target.value,
                      })
                    }
                    rows={3}
                    className="mt-3 w-full rounded-2xl border border-line bg-surface-muted px-4 py-3 text-[14px] text-ink focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-line bg-surface-muted p-4">
        <h3 className="text-[15px] font-semibold text-ink">Answer Key</h3>
        <div className="mt-4 space-y-3">
          {paper.answerKey.map((item, index) => (
            <label key={item.questionId} className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-ink">
                {item.questionId}
              </span>
              <textarea
                value={item.answer}
                onChange={(event) => updateAnswer(index, event.target.value)}
                rows={2}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-[14px] text-ink focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      <label className="mt-6 flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink">Version Note</span>
        <textarea
          value={saveNote}
          onChange={(event) => onSaveNoteChange(event.target.value)}
          rows={2}
          placeholder="What changed in this edit?"
          className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-[14px] text-ink focus:outline-none"
        />
      </label>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-surface-muted px-5 py-2.5 text-[14px] font-medium text-ink ring-1 ring-line-strong"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-full bg-surface-dark px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save as New Version"}
        </button>
      </div>
    </div>
  );
}

function EditorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-[14px] text-ink focus:outline-none"
      />
    </label>
  );
}
