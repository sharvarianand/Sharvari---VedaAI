import Image from "next/image";
import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

/**
 * VedaAI brand mark — sourced directly from the Figma export so the
 * gradient + V glyph stay 1:1 with the design.
 */
export function Logo({ className, size = 36, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/figma/logo-mark.png"
        alt="VedaAI"
        width={size}
        height={size}
        priority
        className="h-9 w-9 select-none"
      />
      {showWordmark && (
        <span className="text-[20px] font-bold tracking-tight text-ink">
          VedaAI
        </span>
      )}
    </div>
  );
}
