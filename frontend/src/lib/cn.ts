import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names while deduping conflicting Tailwind utilities.
 * Usage: cn("p-2 text-sm", isActive && "bg-black text-white")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
