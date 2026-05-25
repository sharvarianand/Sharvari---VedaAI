"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { AssignmentsEmptyState } from "@/components/assignments/empty-state";
import { AssignmentsGrid } from "@/components/assignments/assignments-grid";
import { useAssignmentsStore } from "@/store/assignments-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { api } from "@/lib/api";

export default function AssignmentsPage() {
  const hydrated = useHydrated();
  const assignments = useAssignmentsStore((s) => s.assignments);
  const setAssignments = useAssignmentsStore((s) => s.setAssignments);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await api.listAssignments();
        if (!cancelled) setAssignments(items);
      } catch {
        if (!cancelled) {
          setApiError(
            "Could not reach the API. Showing saved assignments from this device."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, setAssignments]);

  return (
    <>
      <Topbar
        title="Assignment"
        titleIcon={<FileText className="h-[18px] w-[18px]" />}
        showBack
      />
      <section className="relative flex flex-1 flex-col px-2 pb-2">
        {apiError && (
          <p className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-[13px] text-amber-900">
            {apiError}
          </p>
        )}
        {!hydrated || loading ? (
          <div className="flex flex-1 items-center justify-center text-ink-subtle">
            Loading assignments…
          </div>
        ) : assignments.length === 0 ? (
          <AssignmentsEmptyState />
        ) : (
          <AssignmentsGrid assignments={assignments} />
        )}
      </section>
    </>
  );
}
