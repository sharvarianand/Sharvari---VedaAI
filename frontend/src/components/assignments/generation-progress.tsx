"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface GenerationProgressProps {
  percent: number;
  stage: string;
  className?: string;
}

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued for generation…",
  prompting: "Building prompt…",
  "calling-llm": "Generating questions with AI…",
  saving: "Saving question paper…",
  ready: "Complete",
  failed: "Generation failed",
};

export function GenerationProgressView({
  percent,
  stage,
  className,
}: GenerationProgressProps) {
  const label = STAGE_LABELS[stage] ?? "Generating question paper…";
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={cn(
        "card-elevated flex flex-col items-center justify-center rounded-3xl bg-surface px-8 py-16 text-center",
        className
      )}
    >
      <Loader2 className="h-10 w-10 animate-spin text-brand" aria-hidden />
      <h2 className="mt-6 text-[18px] font-semibold text-ink">
        Generating your question paper
      </h2>
      <p className="mt-2 max-w-md text-[14px] text-ink-muted">{label}</p>
      <div className="mt-8 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-2 text-[12px] text-ink-subtle">{clamped}%</p>
    </div>
  );
}
