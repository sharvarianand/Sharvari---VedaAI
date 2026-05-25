"use client";

import { Download, PencilLine, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

interface OutputBannerProps {
  teacherName: string;
  description: string;
  onDownload?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  downloading?: boolean;
  regenerating?: boolean;
  editing?: boolean;
}

export function OutputBanner({
  teacherName,
  description,
  onDownload,
  onRegenerate,
  onEdit,
  downloading = false,
  regenerating = false,
  editing = false,
}: OutputBannerProps) {
  return (
    <div className="card-elevated rounded-3xl bg-surface-dark px-5 py-6 text-white sm:px-7 print:hidden">
      <p className="text-[15px] leading-relaxed">
        <span className="font-semibold">Certainly, {teacherName}!</span> {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2",
            "text-[13px] font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
          )}
        >
          <Download className="h-4 w-4" />
          {downloading ? "Preparing PDF…" : "Download as PDF"}
        </button>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2",
              "text-[13px] font-semibold text-white ring-1 ring-white/30",
              "transition hover:bg-white/10 disabled:opacity-60"
            )}
          >
            <RefreshCw
              className={cn("h-4 w-4", regenerating && "animate-spin")}
            />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2",
              "text-[13px] font-semibold text-white ring-1 ring-white/30",
              "transition hover:bg-white/10"
            )}
          >
            <PencilLine className="h-4 w-4" />
            {editing ? "Close Editor" : "Edit Paper"}
          </button>
        )}
      </div>
    </div>
  );
}
