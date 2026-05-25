"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateDDMMYYYY } from "@/lib/format";
import type { Assignment } from "@/types/assignment";

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

/**
 * A single assignment summary card. Title is clickable + the kebab menu
 * exposes View / Delete actions. Closes on outside click + Escape.
 */
export function AssignmentCard({
  assignment,
  onDelete,
  deleting = false,
}: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      ref={containerRef}
      className="card-elevated relative rounded-2xl bg-surface px-5 py-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/assignments/${assignment.id}/output`}
            className="text-[22px] font-extrabold tracking-tight text-ink hover:opacity-80"
          >
            {assignment.title}
          </Link>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
            {assignment.draft.className ? `Class ${assignment.draft.className}` : "Class N/A"}
            <span className="mx-1 text-ink-subtle">•</span>
            {assignment.draft.subject || "Subject N/A"}
          </p>
        </div>

        <button
          type="button"
          aria-label="Open assignment actions"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-12 flex items-center justify-between text-[13px]">
        <span className="text-ink-muted">
          <span className="font-semibold text-ink">Assigned on</span> :{" "}
          {formatDateDDMMYYYY(assignment.assignedOn)}
        </span>
        <span className="text-ink-muted">
          <span className="font-semibold text-ink">Due</span> :{" "}
          {formatDateDDMMYYYY(assignment.dueOn)}
        </span>
      </div>

      {menuOpen && (
        <div
          role="menu"
          className={cn(
            "card-elevated absolute right-4 top-12 z-10 w-44 overflow-hidden",
            "rounded-xl border border-line bg-surface py-1 text-[14px]"
          )}
        >
          <Link
            role="menuitem"
            href={`/assignments/${assignment.id}/output`}
            className="block px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-muted"
            onClick={() => setMenuOpen(false)}
          >
            View Assignment
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete(assignment.id);
            }}
            disabled={deleting}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-medium text-rose-600 hover:bg-surface-muted disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}
