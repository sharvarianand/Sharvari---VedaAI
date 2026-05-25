"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";

interface TopbarProps {
  title?: string;
  /** Override the default icon shown next to the title. */
  titleIcon?: React.ReactNode;
  /** Hide the back button on root-level routes. */
  showBack?: boolean;
  className?: string;
}

/**
 * Persistent top bar across dashboard routes.
 * Left: back + page label.
 * Right: notifications + user pill.
 */
export function Topbar({
  title = "Assignment",
  titleIcon,
  showBack = true,
  className,
}: TopbarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "flex h-14 w-full items-center justify-between",
        "bg-transparent px-2 pr-2",
        className
      )}
    >
      {/* Left cluster */}
      <div className="flex items-center gap-3 text-ink-muted">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-muted"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
        )}
        <span className="grid h-7 w-7 place-items-center text-ink-muted">
          {titleIcon ?? <LayoutGrid className="h-[18px] w-[18px]" />}
        </span>
        <span className="text-[15px] font-medium text-ink-muted">{title}</span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-surface-muted"
        >
          <Bell className="h-[18px] w-[18px] text-ink" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-surface-muted py-1 pl-1 pr-3"
        >
          <Image
            src="/figma/avatar-user.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            aria-hidden="true"
          />
            <span className="text-[14px] font-medium text-ink">Madhur Rastogi</span>
          <ChevronDown className="h-4 w-4 text-ink-muted" />
        </button>
      </div>
    </header>
  );
}
