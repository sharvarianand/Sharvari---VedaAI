import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * Empty state for the Assignments page — matches the "0 State" Figma frame.
 * Illustration is the Figma export so the strokes and colour balance are
 * pixel-identical to the design.
 */
export function AssignmentsEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Image
        src="/figma/empty-illustration.png"
        alt=""
        width={420}
        height={330}
        priority
        className="h-auto w-[360px] select-none"
      />
      <h2 className="mt-2 text-[18px] font-semibold text-ink">
        No assignments yet
      </h2>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-muted">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>
      <Link
        href="/assignments/create"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-dark px-5 py-2.5 text-[14px] font-semibold text-white transition hover:brightness-110"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Create Your First Assignment
      </Link>
    </div>
  );
}
