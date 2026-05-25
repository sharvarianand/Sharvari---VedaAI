"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface Option {
  value: string;
  label: string;
}

interface SelectPillProps {
  value: string;
  onChange: (next: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Pill-shaped select that mirrors the Figma styling.
 * Uses a native <select> for accessibility + free keyboard handling,
 * styled to match the rest of the form.
 */
export function SelectPill({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  ariaLabel,
}: SelectPillProps) {
  return (
    <div
      className={cn(
        "card-elevated relative inline-flex h-10 items-center rounded-full bg-surface",
        className
      )}
    >
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-full w-full appearance-none bg-transparent pl-4 pr-9",
          "text-[14px] text-ink focus:outline-none"
        )}
      >
        {!value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
    </div>
  );
}
