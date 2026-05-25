import { cn } from "@/lib/cn";
import type { AssignmentStatus } from "@/types/assignment";

const STYLES: Record<AssignmentStatus, string> = {
  draft: "bg-surface-muted text-ink-muted",
  queued: "bg-amber-100 text-amber-800",
  generating: "bg-blue-100 text-blue-800",
  ready: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
};

const LABELS: Record<AssignmentStatus, string> = {
  draft: "Draft",
  queued: "Queued",
  generating: "Generating",
  ready: "Ready",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  );
}
