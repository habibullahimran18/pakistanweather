"use client";

/** WeatherWatch shared UI primitives: KPI cards, states, section headers. */

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------- KPI card ----------

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "violet",
  loading = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: "violet" | "lav" | "sand" | "terra" | "aqua";
  loading?: boolean;
  className?: string;
}) {
  const accents: Record<string, string> = {
    violet: "text-violet bg-violet/10 border-violet/20",
    lav: "text-lav bg-lav/10 border-lav/20",
    sand: "text-sand bg-sand/10 border-sand/20",
    terra: "text-terra bg-terra/10 border-terra/20",
    aqua: "text-aqua bg-aqua/10 border-aqua/20",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet/30 hover:bg-panel-2/40",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet/[0.10] to-transparent"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", accents[accent])}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24 bg-violet/[0.07]" />
      ) : (
        <div className="tabular mt-2.5 text-[26px] font-semibold leading-none tracking-tight text-foreground">
          {value}
        </div>
      )}
      {sub ? (
        <div className="mt-2 text-xs leading-snug text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

// ---------- compact stat tile ----------

export function StatTile({
  label,
  value,
  unit,
  hint,
  valueClass = "",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-panel-2/60 px-3.5 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("tabular mt-1 text-lg font-semibold leading-tight text-foreground", valueClass)}>
        {value}
        {unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}

// ---------- section header ----------

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

// ---------- delta chip ----------

export function DeltaChip({ value, unit = "°C" }: { value: number | null; unit?: string }) {
  if (value === null || Number.isNaN(value)) return <span className="text-xs text-muted-foreground">—</span>;
  const up = value > 0;
  const flat = Math.abs(value) < 0.05;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular",
        flat
          ? "bg-muted text-muted-foreground"
          : up
            ? "bg-terra/15 text-terra"
            : "bg-aqua/15 text-aqua"
      )}
    >
      {flat ? "±" : up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}
      {unit}
    </span>
  );
}

// ---------- loading skeleton for charts ----------

export function ChartSkeleton({ height = 320, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn("flex w-full flex-col justify-end gap-2 rounded-lg border border-border/40 bg-panel-2/30 p-4", className)}
      style={{ height }}
      aria-hidden
    >
      <div className="flex h-full items-end gap-1.5">
        {Array.from({ length: 24 }).map((_, i) => {
          const h = Math.round((25 + Math.abs(Math.sin(i * 1.7)) * 65) * 10) / 10;
          return (
            <Skeleton
              key={i}
              className="flex-1 rounded-sm bg-violet/[0.07]"
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function KpiSkeletonGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/80 bg-card p-5">
          <Skeleton className="h-4 w-28 bg-violet/[0.07]" />
          <Skeleton className="mt-3 h-8 w-20 bg-violet/[0.10]" />
          <Skeleton className="mt-3 h-3 w-36 bg-violet/[0.07]" />
        </div>
      ))}
    </div>
  );
}

// ---------- error state ----------

export function ErrorState({
  message,
  onRetry,
  title = "Something went wrong",
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Retry
        </Button>
      ) : null}
    </div>
  );
}

// ---------- empty state ----------

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-panel-2/40 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-panel-2">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

// ---------- section wrapper with animated entrance ----------

export function SectionBody({ children }: { children: React.ReactNode }) {
  return <div className="ww-fade-up">{children}</div>;
}
