import { cn } from "@/lib/cn";
import type { Difficulty } from "@/types/assignment";

const LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Challenging",
};

const STYLES: Record<Difficulty, string> = {
  easy: "text-emerald-700",
  moderate: "text-amber-700",
  hard: "text-rose-700",
};

interface DifficultyTagProps {
  level: Difficulty;
  className?: string;
}

/**
 * Inline difficulty marker rendered as `[Easy]` / `[Moderate]` / `[Challenging]`.
 * Subtle colour cues fulfil the brief's "highlight difficulty visually" bonus
 * without overpowering the exam-paper aesthetic.
 */
export function DifficultyTag({ level, className }: DifficultyTagProps) {
  return (
    <span className={cn("font-semibold", STYLES[level], className)}>
      [{LABELS[level]}]
    </span>
  );
}
