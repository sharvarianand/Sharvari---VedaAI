"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { OutputBanner } from "@/components/assignments/output-banner";
import { QuestionPaperView } from "@/components/assignments/question-paper";
import { GenerationProgressView } from "@/components/assignments/generation-progress";
import { QuestionPaperEditor } from "@/components/assignments/question-paper-editor";
import { PaperVersionHistory } from "@/components/assignments/paper-version-history";
import { PaperAnalytics } from "@/components/assignments/paper-analytics";
import { TextDiff } from "@/components/ui/text-diff";
import { useAssignmentsStore } from "@/store/assignments-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAssignmentSocket } from "@/hooks/use-assignment-socket";
import toast from "react-hot-toast";
import { api, ApiError } from "@/lib/api";
import { API_BASE_URL } from "@/lib/env";
import { exportDocx } from "@/lib/export";
import type { QuestionPaper } from "@/types/assignment";

interface PageProps {
  params: Promise<{ id: string }>;
}

function clonePaper(paper: QuestionPaper): QuestionPaper {
  return JSON.parse(JSON.stringify(paper)) as QuestionPaper;
}

export default function AssignmentOutputPage({ params }: PageProps) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const assignment = useAssignmentsStore((s) =>
    s.assignments.find((a) => a.id === id)
  );
  const upsertAssignment = useAssignmentsStore((s) => s.upsertAssignment);
  const progress = useAssignmentsStore((s) => s.generationProgress[id]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showRegeneratePanel, setShowRegeneratePanel] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [editablePaper, setEditablePaper] = useState<QuestionPaper | null>(null);
  const [saveNote, setSaveNote] = useState("");
  const [regenerateInstructions, setRegenerateInstructions] = useState("");
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [activeVariant, setActiveVariant] = useState<"A" | "B">("A");
  const [diffMode, setDiffMode] = useState(false);
  const [previousPaperStr, setPreviousPaperStr] = useState<string | null>(null);
  const [lockedQuestionIds, setLockedQuestionIds] = useState<Set<string>>(new Set());

  const toggleLock = useCallback((qId: string) => {
    setLockedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await api.getAssignment(id);
        if (!cancelled) upsertAssignment(doc);
      } catch (err) {
        if (
          !cancelled &&
          !(assignment && err instanceof ApiError && err.status === 404)
        ) {
          setFetchError(
            err instanceof ApiError ? err.message : "Could not load assignment"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!assignment?.paper) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditableTitle(assignment.title);
    setEditablePaper(clonePaper(assignment.paper));
    setSaveNote("");
  }, [assignment?.currentVersion, assignment?.paper, assignment?.title]);

  const triggerPdfDownload = useCallback(
    async (url?: string) => {
      const downloadUrl = url ?? `${API_BASE_URL}/api/assignments/${id}/pdf`;
      const res = await fetch(downloadUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${assignment?.title ?? "question-paper"}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    },
    [id, assignment?.title]
  );

  useAssignmentSocket(id, {
    onPdfReady: async (url) => {
      try {
        await triggerPdfDownload(url);
        toast.success("PDF downloaded successfully!");
      } catch {
        setPdfError("PDF download failed");
        toast.error("PDF download failed");
      } finally {
        setDownloading(false);
      }
    },
    onPdfFailed: (error) => {
      setPdfError(error);
      toast.error(error);
      setDownloading(false);
    },
  });

  const handleDownload = async () => {
    if (!assignment || assignment.status !== "ready") return;
    setPdfError(null);
    setDownloading(true);
    try {
      const blob = await api.downloadPdf(id);
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `${assignment.title}.pdf`;
        a.click();
        URL.revokeObjectURL(objectUrl);
        setDownloading(false);
      }
    } catch (err) {
      setPdfError(
        err instanceof ApiError ? err.message : "Could not download PDF"
      );
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    if (assignment?.paper) {
      setPreviousPaperStr(JSON.stringify(assignment.paper, null, 2));
    }
    setRegenerating(true);
    setFetchError(null);
    try {
      let finalInstructions = regenerateInstructions.trim();
      if (lockedQuestionIds.size > 0 && assignment?.paper) {
        const lockedTexts: string[] = [];
        assignment.paper.sections.forEach(s => {
          s.questions.forEach(q => {
            if (lockedQuestionIds.has(q.id)) {
              lockedTexts.push(q.text);
            }
          });
        });
        if (lockedTexts.length > 0) {
          finalInstructions += `\n\nCRITICAL INSTRUCTION: You MUST perfectly retain the following exact questions in the new paper (do not change or remove them):\n${lockedTexts.map((t, i) => `${i+1}. ${t}`).join("\n")}`;
        }
      }

      const doc = await api.regenerateAssignment(
        id,
        finalInstructions || undefined,
        Array.from(lockedQuestionIds)
      );
      upsertAssignment(doc);
      setShowRegeneratePanel(false);
      setRegenerateInstructions("");
      setEditorOpen(false);
      setDiffMode(true); // Turn on diff mode so when it completes, user sees changes
      setLockedQuestionIds(new Set()); // clear locks
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Regeneration failed";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!editablePaper) return;
    if (!editableTitle.trim()) {
      setFetchError("Question paper title cannot be empty.");
      return;
    }
    setSavingEdits(true);
    setFetchError(null);
    try {
      const doc = await api.updateAssignment(id, {
        title: editableTitle.trim(),
        paper: editablePaper,
        note: saveNote.trim() || undefined,
      });
      upsertAssignment(doc);
      setEditorOpen(false);
      setSaveNote("");
      toast.success("Edits saved successfully");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not save edits";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setSavingEdits(false);
    }
  };

  const handleRestore = async (version: number) => {
    setRestoringVersion(version);
    try {
      const doc = await api.restoreVersion(id, version);
      upsertAssignment(doc);
      toast.success(`Restored to version ${version}`);
      setDiffMode(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Restore failed");
    } finally {
      setRestoringVersion(null);
    }
  };

  const handleCancelEdits = () => {
    if (!assignment?.paper) return;
    setEditableTitle(assignment.title);
    setEditablePaper(clonePaper(assignment.paper));
    setSaveNote("");
    setEditorOpen(false);
  };

  const isGenerating =
    assignment?.status === "queued" || assignment?.status === "generating";
  const isFailed = assignment?.status === "failed";
  const percent = progress?.percent ?? (assignment?.status === "queued" ? 10 : 30);

  return (
    <>
      <Topbar
        title="Create New"
        titleIcon={<Sparkles className="h-[18px] w-[18px] text-brand" />}
      />

      <section className="relative flex flex-1 flex-col gap-5 px-2 pb-2 print:bg-white print:p-0">
        {!hydrated || loading ? (
          <div className="flex flex-1 items-center justify-center text-ink-subtle">
            Loading…
          </div>
        ) : fetchError && !assignment ? (
          <ErrorPanel message={fetchError} id={id} />
        ) : !assignment ? (
          <NotFound id={id} />
        ) : isFailed ? (
          <ErrorPanel
            message={assignment.error ?? "Question generation failed."}
            id={id}
            onRetry={handleRegenerate}
            retrying={regenerating}
          />
        ) : isGenerating || !assignment.paper ? (
          <>
            <OutputBanner
              teacherName="Teacher"
              description="Your AI question paper is being generated. This usually takes a few seconds."
            />
            <GenerationProgressView
              percent={percent}
              stage={progress?.stage ?? assignment.status}
            />
          </>
        ) : (
          <>
            <OutputBanner
              teacherName="Teacher"
              description={`Here is your customized question paper for ${assignment.paper.className} ${assignment.paper.subject}:`}
              onDownload={handleDownload}
              onDownloadDocx={(mode) => exportDocx(
                activeVariant === "A" ? assignment.paper! : (assignment.variantPaper || assignment.paper!),
                mode,
                assignment.title
              )}
              onRegenerate={handleRegenerate}
              onEdit={() => {
                setEditorOpen((open) => !open);
                setShowRegeneratePanel(false);
                setFetchError(null);
              }}
              downloading={downloading}
              regenerating={regenerating}
              editing={editorOpen}
            />
            <div className="flex flex-wrap gap-3 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowRegeneratePanel((open) => !open);
                  setEditorOpen(false);
                  setFetchError(null);
                }}
                className="rounded-full bg-surface px-4 py-2 text-[13px] font-semibold text-ink ring-1 ring-line-strong hover:bg-surface-muted"
              >
                {showRegeneratePanel ? "Hide Regenerate Notes" : "Regenerate with Instructions"}
              </button>
              {previousPaperStr && (
                <button
                  type="button"
                  onClick={() => setDiffMode(!diffMode)}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold ring-1 ${diffMode ? "bg-brand text-white ring-brand" : "bg-surface text-ink ring-line-strong hover:bg-surface-muted"}`}
                >
                  {diffMode ? "Hide Diff" : "Show Changes"}
                </button>
              )}
              <span className="rounded-full bg-surface-muted px-4 py-2 text-[13px] font-medium text-ink-muted">
                Current version: v{assignment.currentVersion || 1}
              </span>
            </div>
            
            {assignment.variantPaper && (
              <div className="flex bg-surface p-1 rounded-full w-fit ring-1 ring-line-strong print:hidden">
                <button
                  onClick={() => setActiveVariant("A")}
                  className={`px-6 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeVariant === "A" ? "bg-surface-dark text-white" : "text-ink-muted hover:text-ink"}`}
                >
                  Set A
                </button>
                <button
                  onClick={() => setActiveVariant("B")}
                  className={`px-6 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeVariant === "B" ? "bg-surface-dark text-white" : "text-ink-muted hover:text-ink"}`}
                >
                  Set B
                </button>
              </div>
            )}
            {fetchError && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-[13px] text-danger print:hidden">
                {fetchError}
              </p>
            )}
            {pdfError && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-[13px] text-danger print:hidden">
                {pdfError}
              </p>
            )}
            {showRegeneratePanel && (
              <div className="card-elevated rounded-3xl bg-surface p-5 print:hidden sm:p-6">
                <h2 className="text-[18px] font-semibold text-ink">
                  Regenerate with Natural-Language Instructions
                </h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  Ask for harder questions, fewer MCQs, stricter distribution, or
                  chapter-specific changes.
                </p>
                <textarea
                  value={regenerateInstructions}
                  onChange={(event) => setRegenerateInstructions(event.target.value)}
                  rows={4}
                  placeholder="Example: Keep Section A easy, make Section B analytical, reduce diagram questions, and focus on electricity numericals."
                  className="mt-4 w-full rounded-2xl border border-line bg-surface-muted px-4 py-3 text-[14px] text-ink focus:outline-none"
                />
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegeneratePanel(false);
                      setRegenerateInstructions("");
                    }}
                    className="rounded-full bg-surface-muted px-5 py-2.5 text-[14px] font-medium text-ink ring-1 ring-line-strong"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="rounded-full bg-surface-dark px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
                  >
                    {regenerating ? "Regenerating…" : "Create New AI Version"}
                  </button>
                </div>
              </div>
            )}
            {editorOpen && editablePaper && (
              <QuestionPaperEditor
                title={editableTitle}
                onTitleChange={setEditableTitle}
                paper={editablePaper}
                onChange={setEditablePaper}
                saveNote={saveNote}
                onSaveNoteChange={setSaveNote}
                onSave={handleSaveEdits}
                onCancel={handleCancelEdits}
                saving={savingEdits}
              />
            )}
            
            {!editorOpen && !diffMode && assignment.paper && (
              <PaperAnalytics paper={activeVariant === "A" ? assignment.paper : (assignment.variantPaper || assignment.paper)} />
            )}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              {diffMode && previousPaperStr ? (
                <div className="card-elevated rounded-3xl bg-surface p-6 font-mono text-[13px] leading-relaxed max-w-none overflow-x-auto">
                  <h3 className="text-[16px] font-bold mb-4 font-sans text-ink">Smart Diff View: What Changed</h3>
                  <TextDiff 
                    oldText={previousPaperStr} 
                    newText={JSON.stringify(activeVariant === "A" ? assignment.paper : (assignment.variantPaper || assignment.paper), null, 2)} 
                  />
                </div>
              ) : (
                <QuestionPaperView 
                  paper={activeVariant === "A" ? assignment.paper : (assignment.variantPaper || assignment.paper)} 
                  lockedQuestionIds={lockedQuestionIds}
                  onToggleLock={toggleLock}
                />
              )}
              <PaperVersionHistory
                versions={assignment.paperVersions}
                currentVersion={assignment.currentVersion}
                onRestore={handleRestore}
                restoringVersion={restoringVersion}
              />
            </div>
          </>
        )}
      </section>
    </>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h2 className="text-[18px] font-semibold text-ink">Assignment not found</h2>
      <p className="mt-1 max-w-md text-[13px] text-ink-muted">
        No assignment with id <code>{id}</code>. It may have been deleted.
      </p>
      <Link
        href="/assignments"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface-dark px-5 py-2.5 text-[14px] font-semibold text-white hover:brightness-110"
      >
        Back to Assignments
      </Link>
    </div>
  );
}

function ErrorPanel({
  message,
  id,
  onRetry,
  retrying,
}: {
  message: string;
  id: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h2 className="text-[18px] font-semibold text-ink">Something went wrong</h2>
      <p className="mt-2 max-w-md text-[13px] text-ink-muted">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="rounded-full bg-surface-dark px-5 py-2.5 text-[14px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {retrying ? "Retrying…" : "Try again"}
          </button>
        )}
        <Link
          href="/assignments"
          className="rounded-full bg-surface px-5 py-2.5 text-[14px] font-medium text-ink ring-1 ring-line-strong hover:bg-surface-muted"
        >
          Back to Assignments
        </Link>
      </div>
      <p className="mt-3 text-[12px] text-ink-subtle">Assignment id: {id}</p>
    </div>
  );
}
