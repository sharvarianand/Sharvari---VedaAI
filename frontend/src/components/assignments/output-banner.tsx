"use client";

import { useState, useRef, useEffect } from "react";
import { Download, PencilLine, RefreshCw, FileText, ChevronDown } from "lucide-react";
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
  onDownloadDocx?: (mode: "questions" | "answers" | "both") => void;
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
  onDownloadDocx,
}: OutputBannerProps) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDownloadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="card-elevated rounded-3xl bg-surface-dark px-5 py-6 text-white sm:px-7 print:hidden">
      <p className="text-[15px] leading-relaxed">
        <span className="font-semibold">Certainly, {teacherName}!</span> {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-3 relative">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDownloadOpen(!downloadOpen)}
            disabled={downloading}
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2",
              "text-[13px] font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
            )}
          >
            <Download className="h-4 w-4" />
            {downloading ? "Preparing Export…" : "Export"}
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          
          {downloadOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden text-ink text-[13px]">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted bg-surface-muted">
                Export as PDF
              </div>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-surface-muted flex items-center gap-2"
                onClick={() => {
                  setDownloadOpen(false);
                  onDownload?.();
                }}
              >
                <FileText className="h-4 w-4 text-brand" />
                Download PDF (Both)
              </button>
              
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted bg-surface-muted border-t border-line">
                Export as Word (.doc)
              </div>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-surface-muted flex items-center gap-2"
                onClick={() => {
                  setDownloadOpen(false);
                  onDownloadDocx?.("both");
                }}
              >
                <FileText className="h-4 w-4 text-blue-500" />
                Both (Paper & Answer Key)
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-surface-muted flex items-center gap-2"
                onClick={() => {
                  setDownloadOpen(false);
                  onDownloadDocx?.("questions");
                }}
              >
                <FileText className="h-4 w-4 text-blue-500" />
                Question Paper Only
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-surface-muted flex items-center gap-2"
                onClick={() => {
                  setDownloadOpen(false);
                  onDownloadDocx?.("answers");
                }}
              >
                <FileText className="h-4 w-4 text-blue-500" />
                Answer Key Only
              </button>
            </div>
          )}
        </div>
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
