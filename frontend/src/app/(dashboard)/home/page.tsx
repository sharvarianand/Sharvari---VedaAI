"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MoreHorizontal, Plus, Users, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";

/* -----------------------------------------------------------------
 * Gauge SVG — semi-circle progress indicator
 * ---------------------------------------------------------------*/
function GaugeChart({ value, max }: { value: number; max: number }) {
  const pct = value / max;
  // Arc geometry: centre (60,65), radius 48, sweep from left to right via top
  const r = 48;
  const cx = 60;
  const cy = 65;
  const startX = cx - r; // leftmost
  const startY = cy;
  // End angle in standard math coords (0 = right, going CCW)
  const endAngleDeg = 180 - pct * 180;
  const endAngleRad = (endAngleDeg * Math.PI) / 180;
  const endX = cx + r * Math.cos(endAngleRad);
  const endY = cy - r * Math.sin(endAngleRad);
  const largeArc = pct > 0.5 ? 1 : 0;

  return (
    <svg viewBox="0 0 120 70" className="h-full w-full" fill="none">
      {/* Track */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${cx + r} ${startY}`}
        stroke="#3a3a3a"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`}
        stroke="#f04e23"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Centre label */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
        {value}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#9a9a9a" fontSize="9">
        of {max}
      </text>
    </svg>
  );
}

/* -----------------------------------------------------------------
 * Demo assignment data
 * ---------------------------------------------------------------*/
const RECENT = [
  {
    id: "a-1",
    title: "Assignment on Motion",
    status: "Active" as const,
    group: "Class 10-A",
    subject: "Science",
    submitted: 50,
    total: 50,
    assignedOn: "20-06-2025",
    due: "21-06-2025",
  },
  {
    id: "a-2",
    title: "Quiz on Electricity",
    status: "Closed" as const,
    group: "Class 10-A",
    subject: "Science",
    submitted: 47,
    total: 50,
    assignedOn: "20-06-2025",
    due: "21-06-2025",
  },
];

/* -----------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------*/
export default function HomePage() {
  return (
    <>
      <Topbar
        title="Home"
        titleIcon={<span className="text-[15px]">⊞</span>}
        showBack={false}
      />

      <section className="flex flex-1 flex-col gap-4 px-2 pb-2">
        {/* ── Greeting ───────────────────────────────────────────── */}
        <div className="px-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]" />
            <h1 className="text-[22px] font-semibold text-ink sm:text-[26px]">
              Hi Madhur 👋
            </h1>
          </div>
          <p className="mt-0.5 pl-[18px] text-[13px] text-ink-muted">
            Welcome Back, Ready to create your next assignment?
          </p>
        </div>

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1 — Assignment Reviewed gauge */}
          <div className="card-elevated flex flex-col rounded-[20px] bg-[#2a2a2a] px-5 py-4">
            <p className="text-[12px] font-medium leading-snug text-[#9a9a9a]">
              Assignment Reviewed
              <br />
              in last 30 days
            </p>
            <div className="mt-2 flex h-24 items-end justify-center">
              <GaugeChart value={67} max={80} />
            </div>
          </div>

          {/* Card 2 — Time Saved */}
          <div className="card-elevated flex flex-col justify-between rounded-[20px] bg-[#2a2a2a] px-5 py-5">
            <p className="text-[12px] font-medium text-[#9a9a9a]">
              Time Saved By AI
            </p>
            <p className="mt-2 text-[36px] font-bold leading-none text-white">
              31.7 hrs
            </p>
            <div className="mt-2 flex items-center justify-between text-[12px] text-white">
              <span>6.5 hrs more than last month</span>
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          {/* Card 3 — Total Graded */}
          <div className="card-elevated relative flex flex-col justify-between overflow-hidden rounded-[20px] bg-surface px-5 py-5">
            <div className="max-w-[calc(100%-90px)] relative z-10">
              <p className="text-[12px] font-medium text-ink-muted">
                Total Assignments Graded
              </p>
              <p className="mt-2 text-[36px] font-bold leading-none text-ink">
                128
              </p>
              <p className="mt-1 text-[12px] text-ink-muted">
                Submitted, pending evaluation
              </p>
            </div>
            {/* Decorative avatar illustration (right) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex h-28 w-28 items-center justify-center">
              <div className="relative h-20 w-20 rounded-full bg-[#f6f8fb] flex items-center justify-center">
                <Image
                  src="/figma/avatar-school.png"
                  alt="Teacher avatar"
                  fill
                  sizes="80px"
                  className="object-cover rounded-full"
                />
              </div>
              {/* Decorative dots */}
              <span className="absolute left-1 top-4 h-2 w-2 rounded-full bg-[#f04e23]" />
              <span className="absolute bottom-4 left-3 h-1.5 w-1.5 rounded-full bg-[#f04e23]" />
              <span className="absolute right-4 top-5 h-1.5 w-1.5 rounded-full bg-[#f04e23]/70" />
              <span className="absolute bottom-6 right-2 h-2 w-2 rounded-full bg-[#f04e23]" />
            </div>
          </div>
        </div>

        {/* ── Recent Assignments ─────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]" />
              <h2 className="text-[16px] font-semibold text-ink">
                Recent Assignments
              </h2>
            </div>
            <Link
              href="/assignments"
              className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium text-ink transition hover:bg-surface-muted"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RECENT.map((a) => (
              <AssignmentCard key={a.id} {...a} />
            ))}
          </div>
        </div>

        {/* ── Feature cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* AI Assignment Grading — highlighted */}
          <div className="card-elevated flex items-center justify-between gap-4 rounded-[20px] border border-brand bg-surface px-5 py-5">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-ink">
                AI Assignment Grading
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                Create assignments and automatically evaluate student responses.
              </p>
            </div>
            <Link
              href="/assignments/create"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-dark px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Create Assignment
            </Link>
          </div>

          {/* AI Exam Grading */}
          <div className="card-elevated flex items-center justify-between gap-4 rounded-[20px] bg-surface px-5 py-5">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-ink">
                AI Exam Grading
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                Automatically evaluate exam papers, generate instant scores, and
                provide detailed feedback and performance insights.
              </p>
            </div>
            <button
              type="button"
              aria-label="Open AI Exam Grading"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted transition hover:bg-line"
            >
              <ChevronRight className="h-4 w-4 text-ink" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

/* -----------------------------------------------------------------
 * Assignment card
 * ---------------------------------------------------------------*/
function AssignmentCard({
  title,
  status,
  group,
  subject,
  submitted,
  total,
  assignedOn,
  due,
}: {
  title: string;
  status: "Active" | "Closed";
  group: string;
  subject: string;
  submitted: number;
  total: number;
  assignedOn: string;
  due: string;
}) {
  const pct = Math.round((submitted / total) * 100);
  return (
    <div className="card-elevated rounded-[20px] bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-ink">{title}</h3>
          <span
            className={
              status === "Active"
                ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                : "rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted"
            }
          >
            {status}
          </span>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-surface-muted"
        >
          <MoreHorizontal className="h-4 w-4 text-ink-muted" />
        </button>
      </div>

      <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
        {group}
        <span className="mx-1 text-ink-subtle">•</span>
        {subject}
      </p>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[18px] font-bold leading-none text-ink">
            {submitted}/{total}{" "}
            <span className="text-[13px] font-normal text-ink-muted">
              Submitted
            </span>
          </p>
        </div>
        <div className="text-right text-[12px] text-ink-muted">
          <p>
            <span className="font-medium text-ink">Assigned on :</span>{" "}
            {assignedOn}
          </p>
          <p>
            <span className="font-medium text-ink">Due :</span> {due}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
