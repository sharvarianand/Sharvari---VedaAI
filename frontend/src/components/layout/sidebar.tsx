"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  FileText,
  Book,
  Clock,
  Settings,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";

/* -----------------------------------------------------------------
 * Nav model
 * ---------------------------------------------------------------*/
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional red pill badge (e.g. unread / pending count). */
  badge?: number;
}

const NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: LayoutGrid },
  { href: "/groups", label: "My Groups", icon: Users },
  { href: "/assignments", label: "Assignments", icon: FileText, badge: 10 },
  { href: "/ai-toolkit", label: "AI Teacher's Toolkit", icon: Book },
  { href: "/library", label: "My Library", icon: Clock },
];

/* -----------------------------------------------------------------
 * Sidebar component
 * ---------------------------------------------------------------*/
interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "card-elevated relative flex w-full shrink-0 flex-col",
        "rounded-[24px] bg-surface px-5 pb-5 pt-6",
        "lg:h-[calc(100vh-24px)] lg:w-[260px]"
      )}
    >
      {/* Brand */}
      <div className="px-1">
        <Logo />
      </div>

      {/* Primary CTA */}
      <Link
        href="/assignments/create"
        onClick={onNavigate}
        className={cn(
          "cta-gradient-ring mt-6 flex items-center justify-center gap-2",
          "rounded-full px-4 py-2.5 text-sm font-semibold text-white",
          "transition hover:brightness-110"
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Create Assignment
      </Link>

      {/* Nav */}
      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2.5",
                "text-[14px] transition",
                isActive
                  ? "bg-surface-muted font-semibold text-ink"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {item.label}
              </span>
              {item.badge ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Spacer pushes the footer down */}
      <div className="flex-1" />

      {/* Settings + School profile */}
      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5",
          "text-[14px] text-ink-muted transition hover:bg-surface-muted hover:text-ink"
        )}
      >
        <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
        Settings
      </Link>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-muted px-3 py-3">
        <Image
          src="/figma/Dpslogo.png"
          alt="Delhi Public School"
          width={72}
          height={72}
          className="h-[72px] w-[72px] shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight text-ink">
            Delhi Public School
          </p>
          <p className="truncate text-[12px] leading-tight text-ink-muted">
            Bokaro Steel City
          </p>
        </div>
      </div>
    </aside>
  );
}
