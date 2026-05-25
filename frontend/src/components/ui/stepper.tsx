import { cn } from "@/lib/cn";

interface StepperProps {
  current: number;
  total: number;
  className?: string;
}

/**
 * Slim two-tone progress bar used at the top of multi-step flows.
 * Reflects the Figma's gradient-on-left / muted-on-right treatment.
 */
export function Stepper({ current, total, className }: StepperProps) {
  const pct = Math.min(Math.max(current / total, 0), 1) * 100;
  return (
    <div
      className={cn("relative h-[3px] w-full rounded-full bg-line", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-ink"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
