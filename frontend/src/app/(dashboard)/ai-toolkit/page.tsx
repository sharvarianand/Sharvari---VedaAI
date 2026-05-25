import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  Lightbulb,
  ListChecks,
  type LucideIcon,
  MessageSquare,
  Mic,
  PenLine,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";

/* -----------------------------------------------------------------
 * Tool catalogue
 * ---------------------------------------------------------------*/

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string; // background + icon colour class pair
  badge?: "New" | "Beta";
  href: string;
}

const FEATURED: Tool = {
  id: "qp",
  title: "AI Question Paper Generator",
  description:
    "Convert any chapter or topic into a board-style question paper with sections, difficulty distribution and answer key.",
  icon: FileText,
  accent: "from-orange-500 to-rose-500",
  href: "/assignments/create",
};

const TOOLS: Tool[] = [
  {
    id: "lp",
    title: "Lesson Plan Generator",
    description: "Create week-by-week lesson plans aligned to the curriculum.",
    icon: BookOpen,
    accent: "bg-emerald-500/10 text-emerald-600",
    badge: "New",
    href: "/ai-toolkit/lesson-plan",
  },
  {
    id: "rb",
    title: "Rubric Builder",
    description: "Design grading rubrics tailored to question types and outcomes.",
    icon: ListChecks,
    accent: "bg-blue-500/10 text-blue-600",
    href: "/ai-toolkit/rubric",
  },
  {
    id: "ws",
    title: "Worksheet Maker",
    description: "Generate printable practice worksheets in seconds.",
    icon: PenLine,
    accent: "bg-fuchsia-500/10 text-fuchsia-600",
    href: "/ai-toolkit/worksheet",
  },
  {
    id: "ex",
    title: "Concept Explainer",
    description: "Get child-friendly explanations and analogies for any topic.",
    icon: Lightbulb,
    accent: "bg-amber-500/10 text-amber-600",
    href: "/ai-toolkit/explain",
  },
  {
    id: "fb",
    title: "Feedback Assistant",
    description: "Draft personalised feedback for each student in your class.",
    icon: MessageSquare,
    accent: "bg-cyan-500/10 text-cyan-600",
    badge: "Beta",
    href: "/ai-toolkit/feedback",
  },
  {
    id: "gr",
    title: "Auto-Grading",
    description: "Score short and long answers using your own rubric.",
    icon: ClipboardCheck,
    accent: "bg-violet-500/10 text-violet-600",
    href: "/ai-toolkit/grading",
  },
  {
    id: "vo",
    title: "Voice-to-Notes",
    description: "Turn classroom voice recordings into structured notes.",
    icon: Mic,
    accent: "bg-pink-500/10 text-pink-600",
    href: "/ai-toolkit/voice-notes",
  },
  {
    id: "wd",
    title: "Worksheet Differentiator",
    description: "Adapt the same worksheet for multiple ability levels.",
    icon: Wand2,
    accent: "bg-teal-500/10 text-teal-600",
    href: "/ai-toolkit/differentiator",
  },
];

export default function ToolkitPage() {
  return (
    <>
      <Topbar
        title="AI Teacher’s Toolkit"
        titleIcon={<Sparkles className="h-[18px] w-[18px] text-brand" />}
        showBack={false}
      />

      <section className="flex flex-1 flex-col gap-5 px-2 pb-2">
        {/* Hero / featured tool */}
        <div
          className={`card-elevated relative overflow-hidden rounded-[24px] bg-gradient-to-br ${FEATURED.accent} px-6 py-8 text-white sm:px-8`}
        >
          {/* Decorative sparkles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <Sparkles className="h-3 w-3" />
                Featured
              </span>
              <h1 className="mt-3 text-[24px] font-semibold leading-tight sm:text-[28px]">
                {FEATURED.title}
              </h1>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/90">
                {FEATURED.description}
              </p>
              <Link
                href={FEATURED.href}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:bg-white/90"
              >
                Start Creating
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="hidden shrink-0 sm:block">
              <div className="grid h-28 w-28 place-items-center rounded-3xl bg-white/15 backdrop-blur">
                <FEATURED.icon className="h-14 w-14 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>

        {/* Tool grid */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[16px] font-semibold text-ink">Explore tools</h2>
            <p className="text-[12px] text-ink-muted">
              {TOOLS.length} tools available
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TOOLS.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                className="card-elevated group flex flex-col rounded-[20px] bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${t.accent}`}
                  >
                    <t.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  {t.badge && (
                    <span
                      className={
                        t.badge === "New"
                          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                          : "rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700"
                      }
                    >
                      {t.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">
                  {t.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  {t.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand opacity-0 transition group-hover:opacity-100">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
