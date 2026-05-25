"use client";

import { useState } from "react";
import {
  Bookmark,
  Download,
  FileText,
  Filter,
  type LucideIcon,
  ListChecks,
  PenLine,
  PieChart,
  Search,
  Star,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/cn";

/* -----------------------------------------------------------------
 * Library items
 * ---------------------------------------------------------------*/

type Kind = "paper" | "worksheet" | "rubric" | "lesson";

interface Resource {
  id: string;
  title: string;
  kind: Kind;
  subject: string;
  className: string;
  updated: string;
  favorite?: boolean;
  pages?: number;
}

const KIND_META: Record<
  Kind,
  { label: string; icon: LucideIcon; accent: string }
> = {
  paper: { label: "Question Paper", icon: FileText, accent: "bg-brand/10 text-brand" },
  worksheet: {
    label: "Worksheet",
    icon: PenLine,
    accent: "bg-fuchsia-500/10 text-fuchsia-600",
  },
  rubric: {
    label: "Rubric",
    icon: ListChecks,
    accent: "bg-blue-500/10 text-blue-600",
  },
  lesson: {
    label: "Lesson Plan",
    icon: PieChart,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
};

const RESOURCES: Resource[] = [
  {
    id: "r-1",
    title: "Quiz on Electricity",
    kind: "paper",
    subject: "Science",
    className: "Class 5",
    updated: "2h ago",
    pages: 3,
    favorite: true,
  },
  {
    id: "r-2",
    title: "Photosynthesis Worksheet",
    kind: "worksheet",
    subject: "Science",
    className: "Class 5",
    updated: "Yesterday",
    pages: 2,
  },
  {
    id: "r-3",
    title: "Comprehension Rubric — Grade 7",
    kind: "rubric",
    subject: "English",
    className: "Class 7",
    updated: "2 days ago",
    favorite: true,
  },
  {
    id: "r-4",
    title: "Algebra Practice Set 4",
    kind: "paper",
    subject: "Math",
    className: "Class 8",
    updated: "3 days ago",
    pages: 4,
  },
  {
    id: "r-5",
    title: "Photosynthesis: Lesson Plan",
    kind: "lesson",
    subject: "Science",
    className: "Class 5",
    updated: "Last week",
  },
  {
    id: "r-6",
    title: "Civics Chapter Test",
    kind: "paper",
    subject: "Social",
    className: "Class 7",
    updated: "Last week",
    pages: 3,
  },
  {
    id: "r-7",
    title: "Spelling & Vocabulary Worksheet",
    kind: "worksheet",
    subject: "English",
    className: "Class 4",
    updated: "2 weeks ago",
    pages: 2,
  },
  {
    id: "r-8",
    title: "Chemistry Unit Lesson Plan",
    kind: "lesson",
    subject: "Chemistry",
    className: "Class 9",
    updated: "3 weeks ago",
  },
];

const FILTERS: { id: "all" | Kind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paper", label: "Papers" },
  { id: "worksheet", label: "Worksheets" },
  { id: "rubric", label: "Rubrics" },
  { id: "lesson", label: "Lesson Plans" },
];

export default function LibraryPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const visible = RESOURCES.filter((r) => {
    if (filter !== "all" && r.kind !== filter) return false;
    if (query && !r.title.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <>
      <Topbar
        title="My Library"
        titleIcon={<PieChart className="h-[18px] w-[18px]" />}
        showBack={false}
      />

      <section className="flex flex-1 flex-col gap-5 px-2 pb-2">
        {/* Header / controls */}
        <div className="card-elevated rounded-[24px] bg-surface px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink">
                My Library
              </h1>
              <p className="mt-1 text-[14px] text-ink-muted">
                Every paper, worksheet and plan you&apos;ve created — saved in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-surface-muted px-3 py-2">
                <Search className="h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search resources…"
                  className="w-48 bg-transparent text-[13px] outline-none placeholder:text-ink-subtle"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-line"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-medium transition",
                    active
                      ? "bg-surface-dark text-white"
                      : "bg-surface-muted text-ink-muted hover:text-ink"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="card-elevated flex flex-1 flex-col items-center justify-center rounded-[24px] bg-surface py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-muted text-ink-muted">
              <Bookmark className="h-6 w-6" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-ink">
              No matching resources
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-ink-muted">
              Try a different filter or clear the search to see everything in
              your library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((r) => {
              const meta = KIND_META[r.kind];
              return (
                <article
                  key={r.id}
                  className="card-elevated group flex flex-col rounded-[20px] bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-2xl ${meta.accent}`}
                    >
                      <meta.icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <button
                      type="button"
                      aria-label={r.favorite ? "Unfavorite" : "Favorite"}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full transition",
                        r.favorite
                          ? "bg-amber-500/10 text-amber-500"
                          : "text-ink-subtle hover:bg-surface-muted"
                      )}
                    >
                      <Star
                        className="h-4 w-4"
                        fill={r.favorite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <h3 className="mt-4 line-clamp-2 text-[15px] font-semibold text-ink">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {meta.label} · {r.subject} · {r.className}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-[12px] text-ink-muted">
                    <span>Updated {r.updated}</span>
                    {r.pages && <span>{r.pages} pages</span>}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-full bg-surface-muted px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-line"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      aria-label="Download"
                      className="grid h-8 w-8 place-items-center rounded-full bg-surface-muted text-ink transition hover:bg-line"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </section>
    </>
  );
}
