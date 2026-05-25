"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Mic,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Stepper } from "@/components/ui/stepper";
import { SelectPill } from "@/components/ui/select-pill";
import { NumberStepper } from "@/components/ui/number-stepper";
import { FileUpload } from "./file-upload";
import { useAssignmentsStore } from "@/store/assignments-store";
import { QUESTION_TYPE_OPTIONS } from "@/lib/question-types";
import { api, ApiError } from "@/lib/api";
import type {
  QuestionTypeConfig,
  QuestionTypeKey,
  PaperLanguage,
} from "@/types/assignment";

interface FieldErrors {
  title?: string;
  subject?: string;
  className?: string;
  dueDate?: string;
  questionTypes?: string;
  submit?: string;
}

function validate(draft: {
  title: string;
  subject?: string;
  className?: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.title.trim()) {
    errors.title = "Please enter a question paper title.";
  }
  if (!draft.subject?.trim()) {
    errors.subject = "Please enter the subject.";
  }
  if (!draft.className?.trim()) {
    errors.className = "Please enter the class.";
  }
  if (!draft.dueDate) {
    errors.dueDate = "Please pick a due date.";
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (draft.dueDate < today) {
      errors.dueDate = "Due date cannot be in the past.";
    }
  }
  if (draft.questionTypes.length === 0) {
    errors.questionTypes = "Add at least one question type.";
  }
  if (
    draft.questionTypes.some(
      (q) => q.count <= 0 || q.marksPerQuestion <= 0
    )
  ) {
    errors.questionTypes = "Questions and marks must be greater than zero.";
  }
  const total = draft.questionTypes.reduce((s, q) => s + q.count, 0);
  if (total > 200) {
    errors.questionTypes = "Maximum 200 questions per paper.";
  }
  return errors;
}

let idCounter = 0;
const nextRowId = () => `qt-${Date.now()}-${++idCounter}`;

export function CreateAssignmentForm() {
  const router = useRouter();
  const draft = useAssignmentsStore((s) => s.draft);
  const setDraft = useAssignmentsStore((s) => s.setDraft);
  const resetDraft = useAssignmentsStore((s) => s.resetDraft);
  const addAssignment = useAssignmentsStore((s) => s.addAssignment);

  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    const q = draft.questionTypes.reduce((acc, r) => acc + r.count, 0);
    const m = draft.questionTypes.reduce(
      (acc, r) => acc + r.count * r.marksPerQuestion,
      0
    );
    return { questions: q, marks: m };
  }, [draft.questionTypes]);

  const updateRow = (id: string, patch: Partial<QuestionTypeConfig>) =>
    setDraft({
      questionTypes: draft.questionTypes.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    });

  const removeRow = (id: string) =>
    setDraft({
      questionTypes: draft.questionTypes.filter((r) => r.id !== id),
    });

  const addRow = () => {
    const used = new Set(draft.questionTypes.map((r) => r.type));
    const fallback =
      QUESTION_TYPE_OPTIONS.find((o) => !used.has(o.value))?.value ?? "mcq";
    setDraft({
      questionTypes: [
        ...draft.questionTypes,
        {
          id: nextRowId(),
          type: fallback,
          count: 1,
          marksPerQuestion: 1,
        },
      ],
    });
  };

  const onSubmit = async () => {
    const e = validate({
      title: draft.title ?? "",
      subject: draft.subject,
      className: draft.className,
      dueDate: draft.dueDate,
      questionTypes: draft.questionTypes,
    });
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    setErrors({});

    try {
      const assignment = await api.createAssignment({
        draft,
        file: materialFile,
      });
      addAssignment(assignment);
      resetDraft();
      setMaterialFile(null);
      router.push(`/assignments/${assignment.id}/output`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not create assignment. Is the backend running?";
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-ink">
            Create Assignment
          </h1>
          <p className="text-[13px] text-ink-muted">
            Set up a new assignment for your students
          </p>
        </div>
      </div>
      <Stepper current={1} total={1} className="mt-5" />

      <div className="card-elevated mt-6 flex-1 rounded-3xl bg-surface-muted p-5 sm:p-7">
        <h2 className="text-[16px] font-semibold text-ink">Assignment Details</h2>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          Basic information about your assignment
        </p>

        <div className="mt-5">
          <label className="text-[14px] font-semibold text-ink">
            Question Paper Title
          </label>
          <div className="card-elevated mt-2 flex items-center gap-2 rounded-full bg-surface px-4">
            <input
              type="text"
              value={draft.title ?? ""}
              onChange={(ev) => setDraft({ title: ev.target.value })}
              placeholder="e.g. Class 8 Science Mid-Term"
              className="h-11 w-full bg-transparent text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none"
            />
          </div>
          {errors.title && (
            <p className="mt-1 text-[12px] text-danger">{errors.title}</p>
          )}
        </div>

        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[14px] font-semibold text-ink">Subject</label>
              <div className="card-elevated mt-2 flex items-center gap-2 rounded-full bg-surface px-4">
                <input
                  type="text"
                  value={draft.subject ?? ""}
                  onChange={(ev) => setDraft({ subject: ev.target.value })}
                  placeholder="e.g. Science"
                  className="h-11 w-full bg-transparent text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none"
                />
              </div>
              {errors.subject && (
                <p className="mt-1 text-[12px] text-danger">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="text-[14px] font-semibold text-ink">Class</label>
              <div className="card-elevated mt-2 flex items-center gap-2 rounded-full bg-surface px-4">
                <input
                  type="text"
                  value={draft.className ?? ""}
                  onChange={(ev) => setDraft({ className: ev.target.value })}
                  placeholder="e.g. 8th"
                  className="h-11 w-full bg-transparent text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none"
                />
              </div>
              {errors.className && (
                <p className="mt-1 text-[12px] text-danger">{errors.className}</p>
              )}
            </div>

            <div>
              <label className="text-[14px] font-semibold text-ink">Language</label>
              <div className="card-elevated mt-2 flex items-center gap-2 rounded-full bg-surface px-4">
                <select
                  value={draft.language ?? "english"}
                  onChange={(ev) => setDraft({ language: ev.target.value as PaperLanguage })}
                  className="h-11 w-full bg-transparent text-[14px] text-ink focus:outline-none cursor-pointer"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="bilingual">Bilingual (English & Hindi)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between card-elevated rounded-2xl bg-surface px-5 py-4 border border-line">
          <div>
            <label className="text-[14px] font-semibold text-ink">Generate Set A/B Variants</label>
            <p className="text-[12px] text-ink-muted mt-0.5">Create two distinct exam variants with equivalent difficulty</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={draft.generateVariants ?? false}
              onChange={(e) => setDraft({ generateVariants: e.target.checked })}
            />
            <div className="w-11 h-6 bg-line-strong rounded-full peer peer-focus:ring-4 peer-focus:ring-brand/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
          </label>
        </div>

        <div className="mt-6">
          <FileUpload
            value={draft.file}
            onChange={(meta) => setDraft({ file: meta })}
            onFileSelect={setMaterialFile}
            accept="image/jpeg,image/png,application/pdf,text/plain"
            hint="JPEG, PNG, PDF, or text — up to 10 MB"
          />
        </div>

        <div className="mt-6">
          <label className="text-[14px] font-semibold text-ink">Due Date</label>
          <div className="card-elevated mt-2 flex items-center gap-2 rounded-full bg-surface px-4">
            <input
              type="date"
              value={draft.dueDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(ev) => setDraft({ dueDate: ev.target.value })}
              className="h-11 w-full bg-transparent text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <CalendarPlus className="h-5 w-5 shrink-0 text-ink" />
          </div>
          {errors.dueDate && (
            <p className="mt-1 text-[12px] text-danger">{errors.dueDate}</p>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-[1fr_auto_140px_140px] items-center gap-x-4 text-[14px] font-semibold text-ink sm:grid-cols-[1fr_auto_180px_180px] sm:gap-x-6">
            <span>Question Type</span>
            <span />
            <span className="text-center">No. of Questions</span>
            <span className="text-center">Marks</span>
          </div>

          <div className="mt-3 flex min-w-[520px] flex-col gap-3">
            {draft.questionTypes.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_auto_140px_140px] items-center gap-x-4 sm:grid-cols-[1fr_auto_180px_180px] sm:gap-x-6"
              >
                <SelectPill
                  value={row.type}
                  onChange={(v) =>
                    updateRow(row.id, { type: v as QuestionTypeKey })
                  }
                  options={QUESTION_TYPE_OPTIONS}
                  ariaLabel="Question type"
                />
                <button
                  type="button"
                  aria-label="Remove row"
                  onClick={() => removeRow(row.id)}
                  className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-surface"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex justify-center">
                  <NumberStepper
                    value={row.count}
                    onChange={(n) => updateRow(row.id, { count: n })}
                    min={1}
                    max={100}
                    ariaLabel="Number of questions"
                  />
                </div>
                <div className="flex justify-center">
                  <NumberStepper
                    value={row.marksPerQuestion}
                    onChange={(n) => updateRow(row.id, { marksPerQuestion: n })}
                    min={1}
                    max={100}
                    ariaLabel="Marks per question"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className={cn(
              "mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-ink",
              "hover:text-brand"
            )}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-dark text-white">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add Question Type
          </button>

          <div className="mt-6 flex flex-col items-end text-[14px] font-semibold text-ink">
            <span>Total Questions : {totals.questions}</span>
            <span className="mt-1">Total Marks : {totals.marks}</span>
          </div>

          {errors.questionTypes && (
            <p className="mt-2 text-[12px] text-danger">{errors.questionTypes}</p>
          )}
        </div>

        <div className="mt-6">
          <label className="text-[14px] font-semibold text-ink">
            Additional Information{" "}
            <span className="font-normal text-ink-muted">(For better output)</span>
          </label>
          <div className="card-elevated mt-2 flex items-start gap-2 rounded-2xl bg-surface px-4 py-3">
            <textarea
              value={draft.additionalInstructions}
              onChange={(ev) =>
                setDraft({ additionalInstructions: ev.target.value })
              }
              rows={3}
              placeholder="e.g. Generate a 3-hour exam paper focused on NCERT chapters…"
              className="min-h-[80px] w-full resize-none bg-transparent text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <button
              type="button"
              aria-label="Dictate"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-surface-muted"
            >
              <Mic className="h-4 w-4 text-ink-muted" />
            </button>
          </div>
        </div>

        {errors.submit && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-danger">
            {errors.submit}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-[14px] font-medium text-ink ring-1 ring-line-strong hover:bg-surface-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-surface-dark px-6 py-2.5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Generate Question Paper"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
