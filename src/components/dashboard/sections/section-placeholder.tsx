"use client";

import { useDashboard } from "@/lib/store";
import { SECTION_BY_ID } from "@/components/dashboard/section-meta";

/**
 * Temporary scaffold for a dashboard section. Replaced by the full
 * implementations as they are built.
 */
export function SectionPlaceholder({ id }: { id: keyof typeof SECTION_BY_ID }) {
  const setSection = useDashboard((s) => s.setSection);
  const meta = SECTION_BY_ID[id];

  return (
    <div className="rounded-xl border border-border/70 bg-card px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">{meta.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{meta.subtitle}</p>
      <button
        type="button"
        className="mt-6 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-colors hover:bg-secondary/70"
        onClick={() => setSection("overview")}
      >
        Back to Overview
      </button>
    </div>
  );
}
