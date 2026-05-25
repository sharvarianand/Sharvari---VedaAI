import { Topbar } from "./topbar";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * Shared "Coming Soon" surface used by nav destinations that are
 * out of scope for the current milestone (Home, My Groups, Library, etc.).
 */
export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <>
      <Topbar title={title} titleIcon={icon} showBack={false} />
      <section className="card-elevated flex flex-1 flex-col items-center justify-center rounded-[24px] bg-surface px-6 py-12 text-center">
        <h1 className="text-[20px] font-semibold text-ink">{title}</h1>
        <p className="mt-2 max-w-md text-[14px] text-ink-muted">
          {description ?? "This module is part of the upcoming release."}
        </p>
      </section>
    </>
  );
}
