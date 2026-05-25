import Link from "next/link";
import {
  ArrowUpRight,
  GraduationCap,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";

/* -----------------------------------------------------------------
 * Sample groups — placeholder until the groups API exists.
 * ---------------------------------------------------------------*/

interface Group {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  avgScore: number;
  lastActivity: string;
  accent: string; // tailwind gradient classes for the cover band
}

const GROUPS: Group[] = [
  {
    id: "g-1",
    name: "Class 5A",
    subject: "Science",
    studentCount: 32,
    avgScore: 84,
    lastActivity: "Quiz on Electricity · 2h ago",
    accent: "from-orange-400 to-rose-500",
  },
  {
    id: "g-2",
    name: "Class 5B",
    subject: "Science",
    studentCount: 30,
    avgScore: 79,
    lastActivity: "Photosynthesis Worksheet · 1d ago",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    id: "g-3",
    name: "Class 7B",
    subject: "English",
    studentCount: 28,
    avgScore: 88,
    lastActivity: "Comprehension Test · 3d ago",
    accent: "from-blue-400 to-indigo-500",
  },
  {
    id: "g-4",
    name: "Class 8A",
    subject: "Mathematics",
    studentCount: 34,
    avgScore: 76,
    lastActivity: "Algebra Set 4 · 5d ago",
    accent: "from-fuchsia-400 to-purple-500",
  },
  {
    id: "g-5",
    name: "Class 9A",
    subject: "Chemistry",
    studentCount: 29,
    avgScore: 81,
    lastActivity: "Unit Test pending · Tomorrow",
    accent: "from-amber-400 to-orange-500",
  },
  {
    id: "g-6",
    name: "Class 7C",
    subject: "Social Studies",
    studentCount: 27,
    avgScore: 73,
    lastActivity: "Civics Chapter Test · 1w ago",
    accent: "from-sky-400 to-cyan-500",
  },
];

export default function GroupsPage() {
  return (
    <>
      <Topbar
        title="My Groups"
        titleIcon={<ImageIcon className="h-[18px] w-[18px]" />}
        showBack={false}
      />

      <section className="flex flex-1 flex-col gap-5 px-2 pb-2">
        {/* Header card */}
        <div className="card-elevated rounded-[24px] bg-surface px-6 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink">
                My Groups
              </h1>
              <p className="mt-1 text-[14px] text-ink-muted">
                Manage your classes, monitor performance, and assign quickly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-surface-muted px-3 py-2">
                <Search className="h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Search groups…"
                  className="w-44 bg-transparent text-[13px] outline-none placeholder:text-ink-subtle"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-surface-dark px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                New Group
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <article
              key={g.id}
              className="card-elevated group relative flex flex-col overflow-hidden rounded-[20px] bg-surface"
            >
              {/* Cover band */}
              <div
                className={`relative h-24 bg-gradient-to-br ${g.accent}`}
              >
                <button
                  type="button"
                  aria-label="More actions"
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <div className="absolute -bottom-5 left-5 grid h-12 w-12 place-items-center rounded-2xl bg-white text-ink shadow-sm">
                  <GraduationCap className="h-6 w-6" strokeWidth={1.75} />
                </div>
              </div>

              <div className="px-5 pb-5 pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-semibold text-ink">{g.name}</h3>
                    <p className="text-[12px] text-ink-muted">{g.subject}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-ink">
                    <Users className="h-3 w-3" />
                    {g.studentCount}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-muted px-3 py-2.5">
                    <p className="text-[11px] text-ink-muted">Avg. Score</p>
                    <p className="mt-0.5 text-[16px] font-semibold text-ink">
                      {g.avgScore}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-muted px-3 py-2.5">
                    <p className="text-[11px] text-ink-muted">Students</p>
                    <p className="mt-0.5 text-[16px] font-semibold text-ink">
                      {g.studentCount}
                    </p>
                  </div>
                </div>

                <p className="mt-3 truncate text-[12px] text-ink-muted">
                  {g.lastActivity}
                </p>

                <Link
                  href={`/groups/${g.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline"
                >
                  View group <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
