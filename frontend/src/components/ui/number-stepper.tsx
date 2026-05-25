"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  className?: string;
}

/**
 * Compact ± control. Used for "No. of Questions" and "Marks" cells.
 * Clamps to [min, max] and ignores out-of-range manual edits.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  ariaLabel,
  className,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max);

  return (
    <div
      className={cn(
        "card-elevated inline-flex h-10 items-center justify-between gap-1",
        "rounded-full bg-surface px-1.5",
        className
      )}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-surface-muted disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isFinite(next)) return;
          onChange(clamp(next));
        }}
        className="w-10 bg-transparent text-center text-[14px] font-semibold text-ink focus:outline-none"
      />
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-surface-muted disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
