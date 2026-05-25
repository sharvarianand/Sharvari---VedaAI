"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/cn";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col gap-3 bg-app-bg p-3 lg:flex-row lg:gap-4">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileNavOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-[14px] font-medium text-ink ring-1 ring-line lg:hidden"
      >
        <Menu className="h-5 w-5" />
        Menu
      </button>

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex h-full w-[min(280px,85vw)] flex-col bg-app-bg p-3">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setMobileNavOpen(false)}
              className="mb-2 inline-flex h-9 w-9 items-center justify-center self-end rounded-full bg-surface"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <main className={cn("flex min-w-0 flex-1 flex-col gap-4")}>{children}</main>
    </div>
  );
}
