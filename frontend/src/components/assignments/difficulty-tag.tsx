import { cn } from "@/lib/cn";
import type { Difficulty } from "@/types/assignment";

const LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Medium",
  hard: "Hard",
};

const STYLES: Record<Difficulty, string> = {
  easy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  moderate: "border-amber-200 bg-amber-50 text-amber-700",
  hard: "border-rose-200 bg-rose-50 text-rose-700",
};

const DOT_STYLES: Record<Difficulty, string> = {
  easy: "bg-emerald-500",
  moderate: "bg-amber-500",
  hard: "bg-rose-500",
};

interface DifficultyTagProps {
  level: Difficulty;
  className?: string;
}

/**
 * Render difficulty as a compact badge so the paper communicates effort
 * level immediately without losing the exam-sheet tone.
 */
export function DifficultyTag({ level, className }: DifficultyTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold align-middle",
        STYLES[level],
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", DOT_STYLES[level])} />
      {LABELS[level]}
    </span>
  );
}
