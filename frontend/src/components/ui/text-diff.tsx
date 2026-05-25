"use client";

import { diffWords } from "diff";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

interface TextDiffProps {
  oldText: string;
  newText: string;
  className?: string;
}

export function TextDiff({ oldText, newText, className }: TextDiffProps) {
  const parts = useMemo(() => diffWords(oldText, newText), [oldText, newText]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="bg-emerald-100 text-emerald-900 px-0.5 rounded-sm">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="bg-rose-100 text-rose-900 px-0.5 rounded-sm line-through opacity-70">
              {part.value}
            </span>
          );
        }
        return <span key={i} className="text-ink-subtle">{part.value}</span>;
      })}
    </span>
  );
}
