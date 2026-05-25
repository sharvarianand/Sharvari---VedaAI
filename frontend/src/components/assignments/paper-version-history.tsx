"use client";

import type { PaperVersion } from "@/types/assignment";

interface PaperVersionHistoryProps {
  versions: PaperVersion[];
  currentVersion: number;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PaperVersionHistory({
  versions,
  currentVersion,
  onRestore,
  restoringVersion,
}: PaperVersionHistoryProps & { 
  onRestore?: (version: number) => void;
  restoringVersion?: number | null;
}) {
  const ordered = [...versions].sort((a, b) => b.version - a.version);

  return (
    <aside className="card-elevated rounded-3xl bg-surface p-5 sm:p-6 print:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Version History</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Every AI generation or manual save creates a new version.
          </p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-[12px] font-semibold text-ink">
          Current v{currentVersion}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {ordered.length === 0 ? (
          <p className="text-[13px] text-ink-muted">No saved versions yet.</p>
        ) : (
          ordered.map((version) => (
            <div
              key={version.version}
              className="rounded-2xl border border-line bg-surface-muted p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    v{version.version} · {version.title}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {version.source === "ai" ? "AI generated" : "Manual edit"} ·{" "}
                    {formatTimestamp(version.createdAt)}
                  </p>
                </div>
                {version.version === currentVersion ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    Current
                  </span>
                ) : onRestore ? (
                  <button
                    type="button"
                    onClick={() => onRestore(version.version)}
                    disabled={restoringVersion === version.version}
                    className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-ink ring-1 ring-line-strong hover:bg-surface-muted disabled:opacity-50"
                  >
                    {restoringVersion === version.version ? "Restoring…" : "Restore"}
                  </button>
                ) : null}
              </div>
              {version.note && (
                <p className="mt-3 text-[13px] text-ink">{version.note}</p>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
