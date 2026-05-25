"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Assignment } from "@/types/assignment";
import { useAssignmentsStore } from "@/store/assignments-store";
import { api } from "@/lib/api";
import { AssignmentCard } from "./assignment-card";

interface AssignmentsGridProps {
  assignments: Assignment[];
}

/**
 * Filled-state view: search, filter, grid of cards, and a floating
 * create-new CTA pinned to the bottom of the scroll viewport.
 */
export function AssignmentsGrid({ assignments }: AssignmentsGridProps) {
  const removeAssignment = useAssignmentsStore((s) => s.removeAssignment);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteAssignment(id);
      removeAssignment(id);
    } catch {
      /* keep card if API unavailable */
      removeAssignment(id);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((a) => a.title.toLowerCase().includes(q));
  }, [assignments, query]);

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Header strip */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 px-1">
          <div className="mt-2.5 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-ink">
              Assignments
            </h1>
            <p className="text-[14px] text-ink-muted mt-0.5">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>

        <div className="card-elevated mt-2 flex items-center justify-between rounded-[24px] bg-surface px-3 py-2.5">
          <FilterControl />
          <SearchBox value={query} onChange={setQuery} />
        </div>
      </div>

      {/* Card grid */}
      <div className="mt-5 grid flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto pb-24 lg:grid-cols-2">
        {filtered.map((a) => (
          <AssignmentCard
            key={a.id}
            assignment={a}
            onDelete={handleDelete}
            deleting={deletingId === a.id}
          />
        ))}
      </div>

      {/* Floating create CTA */}
      <Link
        href="/assignments/create"
        className={cn(
          "card-elevated absolute bottom-4 left-1/2 -translate-x-1/2",
          "inline-flex items-center gap-2 rounded-full bg-surface-dark px-5 py-3",
          "text-[14px] font-semibold text-white transition hover:brightness-110"
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Create Assignment
      </Link>
    </div>
  );
}

/* -----------------------------------------------------------------
 * Sub-components
 * ---------------------------------------------------------------*/

function FilterControl() {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-transparent",
        "px-4 py-2 text-[14px] font-medium text-ink-muted hover:text-ink"
      )}
    >
      <Filter className="h-4 w-4" />
      Filter By
    </button>
  );
}

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
}

function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <label
      className={cn(
        "flex w-full max-w-[280px] items-center gap-2",
        "rounded-full border border-line bg-app-bg px-4 py-2"
      )}
    >
      <Search className="h-4 w-4 text-ink-subtle" />
      <input
        type="search"
        placeholder="Search Assignment"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[14px] placeholder:text-ink-subtle focus:outline-none"
      />
    </label>
  );
}
