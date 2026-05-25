"use client";

import { Topbar } from "@/components/layout/topbar";
import { CreateAssignmentForm } from "@/components/assignments/create-assignment-form";
import { useHydrated } from "@/hooks/use-hydrated";

export default function CreateAssignmentPage() {
  const hydrated = useHydrated();
  return (
    <>
      <Topbar title="Assignment" />
      <section className="relative flex flex-1 flex-col px-2 pb-2">
        {hydrated ? (
          <CreateAssignmentForm />
        ) : (
          <div className="flex flex-1 items-center justify-center text-ink-subtle">
            Loading…
          </div>
        )}
      </section>
    </>
  );
}
