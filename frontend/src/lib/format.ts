import { format, isValid, parseISO } from "date-fns";

/**
 * Render an ISO date (yyyy-mm-dd) as the dd-MM-yyyy form used across
 * the UI. Returns an em dash if the input cannot be parsed.
 */
export function formatDateDDMMYYYY(iso: string): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd-MM-yyyy") : "—";
}
