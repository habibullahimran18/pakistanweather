"use client";

/**
 * DATA QUALITY & ABOUT — combined section.
 *
 * The section registry maps both the "quality" and "about" sidebar entries to
 * this component. The active tab is derived from the zustand store so the
 * sidebar highlight stays in sync; switching tabs writes back to the store.
 */

import {
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarRange,
  CloudRain,
  CloudRainWind,
  Copy,
  Cpu,
  Database,
  Droplets,
  FileDown,
  FileJson,
  FileSpreadsheet,
  Gauge,
  Globe,
  Info,
  Layers,
  LineChart,
  MapPin,
  Satellite,
  ShieldCheck,
  Shuffle,
  Target,
  Thermometer,
  Wind,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ErrorState,
  KpiCard,
  KpiSkeletonGrid,
  SectionBody,
  SectionHeader,
} from "@/components/dashboard/ui-bits";
import { SECTION_BY_ID } from "@/components/dashboard/section-meta";
import { useQuality } from "@/hooks/use-weather";
import { useDashboard } from "@/lib/store";
import { cityColor, fmtDate, fmtDateRange, fmtInt, fmtPct } from "@/lib/weather/format";
import { CITIES_META, WEATHER_PARAMETERS } from "@/lib/weather/types";
import type { QualityReport } from "@/lib/weather/api-types";
import { cn } from "@/lib/utils";

// ---------- local card shell ----------

function PanelCard({
  icon: Icon,
  title,
  subtitle,
  iconAccent = "violet",
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  iconAccent?: "violet" | "sand";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(43,35,80,0.08)] sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            iconAccent === "sand"
              ? "border-sand/25 bg-sand/10 text-sand"
              : "border-violet/20 bg-violet/10 text-violet"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs leading-snug text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function PanelSkeleton() {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-6">
      <Skeleton className="h-4 w-44 bg-violet/[0.07]" />
      <Skeleton className="mt-5 h-3 w-full bg-violet/[0.07]" />
      <Skeleton className="mt-2 h-3 w-5/6 bg-violet/[0.07]" />
      <Skeleton className="mt-2 h-3 w-2/3 bg-violet/[0.07]" />
    </div>
  );
}

// ---------- palette helpers ----------

function missingBarColor(pct: number): string {
  if (pct < 1) return "#8B7CF6"; // violet
  if (pct < 5) return "#f0b429"; // amber warning
  return "#e46a5a"; // soft red danger
}

function continuityBarColor(pct: number): string {
  if (pct >= 99.9) return "#2FA98C"; // lavender
  if (pct >= 99) return "#8B7CF6"; // violet
  return "#f0b429"; // amber warning
}

// ---------- static about content ----------

interface PipelineNode {
  icon: LucideIcon;
  title: string;
  caption: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  { icon: Globe, title: "Open-Meteo API", caption: "archive-api.open-meteo.com" },
  { icon: FileDown, title: "Extraction", caption: "extract.py" },
  { icon: FileJson, title: "Raw JSON", caption: "data/raw/weather_raw.json" },
  { icon: Shuffle, title: "Transformation", caption: "transform.py" },
  { icon: FileSpreadsheet, title: "Clean CSV", caption: "data/processed/weather_clean.csv" },
  { icon: Database, title: "SQLite", caption: "data/database/weather.db" },
  { icon: LineChart, title: "EDA", caption: "eda.py + reports/" },
];

const STACK_CHIPS = ["Python 3", "pandas", "requests", "sqlite3", "matplotlib", "ETL + EDA pipeline"];

const DATASET_LIMITATIONS = [
  "Values are reanalysis-based model estimates, not direct station observations.",
  "Each city is represented by a single grid point, so microclimates within a metro area are not captured.",
  "Daily aggregates follow Asia/Karachi local time throughout the dataset.",
  "precipitation_sum includes rain plus the water equivalent of frozen precipitation.",
  "Wind speed and gusts are measured at 10 m and reported as daily maxima.",
  "The archive can lag near-real-time observations by a few days.",
];

interface ValidationCheck {
  icon: LucideIcon;
  label: string;
  hint: string;
  failed: number;
}

// ---------- main component ----------

export default function SectionQuality() {
  const section = useDashboard((s) => s.section);
  const activeTab: "quality" | "about" = section === "about" ? "about" : "quality";
  const meta = SECTION_BY_ID[activeTab];

  return (
    <SectionBody>
      <SectionHeader title={meta.title} subtitle={meta.subtitle} />
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          useDashboard.getState().setSection(value === "about" ? "about" : "quality")
        }
        className="gap-6"
      >
        <TabsList
          className="h-10 rounded-xl border border-border/60 bg-panel-2/60 p-1"
          aria-label="Data quality and about project views"
        >
          <TabsTrigger value="quality" className="gap-1.5 rounded-lg px-3.5">
            <ShieldCheck aria-hidden /> Data Quality
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5 rounded-lg px-3.5">
            <Info aria-hidden /> About Project
          </TabsTrigger>
        </TabsList>
        <TabsContent value="quality">
          <QualityTab />
        </TabsContent>
        <TabsContent value="about">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </SectionBody>
  );
}

// ---------- tab 1: data quality ----------

function QualityTab() {
  const query = useQuality();

  if (query.isError) {
    return (
      <ErrorState
        message={query.error?.message ?? "Failed to load the data quality report."}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="space-y-6">
        <KpiSkeletonGrid />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    );
  }

  return <QualityPanel report={query.data} />;
}

function CheckBadge({ failed }: { failed: number }) {
  if (failed === 0) {
    return <Badge className="border-lav/30 bg-lav/10 text-lav">Pass</Badge>;
  }
  return <Badge className="border-terra/30 bg-terra/10 text-terra">{fmtInt(failed)} failed</Badge>;
}

function QualityPanel({ report: q }: { report: QualityReport }) {
  const completenessAccent = q.completenessPct >= 99.9 ? "lav" : q.completenessPct < 99 ? "sand" : "violet";
  const allColumnsComplete = q.missingByColumn.every((col) => col.count === 0);

  const checks: ValidationCheck[] = [
    {
      icon: Thermometer,
      label: "Min temp never exceeds max temp",
      hint: "tmin <= tmax on every stored record",
      failed: q.validation.minAboveMax,
    },
    {
      icon: ArrowDownUp,
      label: "Mean stays within min/max bounds",
      hint: "tmin <= tmean <= tmax",
      failed: q.validation.meanOutsideRange,
    },
    {
      icon: CloudRain,
      label: "Rain never exceeds total precipitation",
      hint: "rain_sum <= precipitation_sum",
      failed: q.validation.rainAbovePrecipitation,
    },
    {
      icon: Droplets,
      label: "No negative precipitation",
      hint: "precipitation_sum >= 0 everywhere",
      failed: q.validation.negativePrecipitation,
    },
    {
      icon: Wind,
      label: "Gusts at least the sustained wind speed",
      hint: "gusts_10m_max >= wind_speed_10m_max",
      failed: q.validation.gustBelowWind,
    },
    {
      icon: Gauge,
      label: "Temperatures physically plausible",
      hint: "checked against the -25…55 °C envelope",
      failed: q.validation.temperaturePhysicallyImplausible,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Database}
          label="Total Records"
          value={fmtInt(q.totalRecords)}
          sub={`${q.cities} cities · ${fmtDateRange(q.start, q.end)}`}
          accent="violet"
        />
        <KpiCard
          icon={BadgeCheck}
          label="Completeness"
          value={`${q.completenessPct}%`}
          sub={`${fmtInt(q.numericCells)} numeric cells checked`}
          accent={completenessAccent}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Missing Measurements"
          value={fmtInt(q.missingTotal)}
          sub="Preserved as missing — never zero-filled"
          accent={q.missingTotal === 0 ? "lav" : "terra"}
        />
        <KpiCard
          icon={Copy}
          label="Duplicate City-Date Pairs"
          value={fmtInt(q.duplicatesRemoved)}
          sub={`${fmtInt(q.duplicatePairsRemaining)} remaining in the dataset`}
          accent="aqua"
        />
      </div>

      {/* Missing by column + records per city */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelCard
          icon={Layers}
          title="Missing values by column"
          subtitle="Share of missing daily measurements per numeric column"
        >
          {allColumnsComplete ? (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-lav/25 bg-lav/10 px-3 py-2 text-xs font-medium text-lav">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              All numeric columns are complete
            </div>
          ) : null}
          <ul className="space-y-4">
            {q.missingByColumn.map((col) => (
              <li key={col.column}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">{col.label}</span>
                    <span className="block font-mono text-[10px] text-fog">{col.column}</span>
                  </span>
                  {col.count === 0 ? (
                    <Badge className="border-lav/30 bg-lav/10 text-lav">Complete</Badge>
                  ) : (
                    <span className="tabular shrink-0 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{fmtInt(col.count)}</span> missing ·{" "}
                      {fmtPct(col.pct)}
                    </span>
                  )}
                </div>
                {col.count === 0 ? null : (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded bg-violet/[0.07]">
                    <div
                      className="h-full rounded"
                      style={{ width: `${Math.max(col.pct, 0.5)}%`, backgroundColor: missingBarColor(col.pct) }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard
          icon={Building2}
          title="Records per city"
          subtitle="Stored daily records against the expected calendar window"
        >
          <ul className="space-y-4">
            {q.recordsPerCity.map((row) => (
              <li key={row.city}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cityColor(row.city) }} aria-hidden />
                    {row.city}
                  </span>
                  <span className="tabular shrink-0 text-xs text-muted-foreground">
                    {fmtInt(row.records)} / {fmtInt(row.expected)} days ·{" "}
                    <span className="font-semibold text-foreground">{fmtPct(row.completenessPct)}</span>
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded bg-violet/[0.07]">
                  <div
                    className="h-full rounded"
                    style={{ width: `${Math.min(row.completenessPct, 100)}%`, backgroundColor: cityColor(row.city) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      {/* Date coverage */}
      <PanelCard
        icon={CalendarRange}
        title="Date coverage"
        subtitle="First and last stored date per city with calendar-day continuity"
      >
        <div className="ww-scroll overflow-x-auto rounded-lg border border-border/60 bg-panel-2/40">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">City</TableHead>
                <TableHead className="text-xs text-muted-foreground">Start</TableHead>
                <TableHead className="text-xs text-muted-foreground">End</TableHead>
                <TableHead className="text-right text-xs text-muted-foreground">Expected days</TableHead>
                <TableHead className="text-right text-xs text-muted-foreground">Present days</TableHead>
                <TableHead className="text-right text-xs text-muted-foreground">Missing days</TableHead>
                <TableHead className="min-w-[150px] text-xs text-muted-foreground">Continuity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.coverage.map((row) => (
                <TableRow key={row.city} className="border-border/40">
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cityColor(row.city) }} aria-hidden />
                      {row.city}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(row.start)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(row.end)}</TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">{fmtInt(row.expectedDays)}</TableCell>
                  <TableCell className="tabular text-right text-foreground">{fmtInt(row.presentDays)}</TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">{fmtInt(row.missingDays)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded bg-violet/[0.07]">
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${Math.min(row.continuityPct, 100)}%`,
                            backgroundColor: continuityBarColor(row.continuityPct),
                          }}
                        />
                      </div>
                      <span className="tabular text-xs text-foreground">{fmtPct(row.continuityPct)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PanelCard>

      {/* Validation checks */}
      <PanelCard
        icon={ShieldCheck}
        title="Validation checks"
        subtitle="Rule-based sanity checks evaluated over every stored record"
      >
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-3 rounded-lg border border-border/60 bg-panel-2/60 px-3.5 py-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  check.failed === 0
                    ? "border-violet/20 bg-violet/10 text-violet"
                    : "border-terra/25 bg-terra/10 text-terra"
                )}
              >
                <check.icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug text-foreground">{check.label}</span>
                <span className="block text-[11px] leading-snug text-muted-foreground">{check.hint}</span>
              </span>
              <CheckBadge failed={check.failed} />
            </li>
          ))}
          <li className="flex items-center gap-3 rounded-lg border border-sand/25 bg-sand/5 px-3.5 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sand/25 bg-sand/10 text-sand">
              <CloudRainWind className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-snug text-foreground">
                Heavy precipitation days (≥50 mm)
              </span>
              <span className="block text-[11px] leading-snug text-muted-foreground">
                Informational count — not a validation failure
              </span>
            </span>
            <span className="tabular text-sm font-semibold text-sand">{fmtInt(q.validation.heavyRainDays)}</span>
            <Badge className="border-sand/30 bg-sand/10 text-sand">Info</Badge>
          </li>
        </ul>
      </PanelCard>
    </div>
  );
}

// ---------- tab 2: about project ----------

function AboutTab() {
  return (
    <div className="space-y-6">
      {/* Objective */}
      <PanelCard icon={Target} title="Project Objective" subtitle="A Python ETL + EDA pipeline with a Next.js presentation layer">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Pakistan WeatherWatch</span> builds a historical daily weather
            intelligence dataset for five major Pakistani cities — Lahore, Karachi, Islamabad, Peshawar and Quetta —
            covering Jan 1, 2024 through Dec 31, 2025 (731 calendar days per city). A Python ETL pipeline extracts the
            data, cleans and validates it, loads it into SQLite, and produces exploratory analysis; this Next.js
            dashboard visualizes the result.
          </p>
          <p>
            Every figure on this dashboard — KPIs, trends, extremes, seasonal profiles and the quality metrics on the
            Data Quality tab — is computed live from the cleaned dataset through the API layer. No statistics are
            hardcoded anywhere in the interface.
          </p>
        </div>
      </PanelCard>

      {/* Monitored cities */}
      <PanelCard
        icon={MapPin}
        title="Monitored Cities"
        subtitle="Five major cities spanning Pakistan's dominant climate zones"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CITIES_META.map((c) => (
            <div key={c.name} className="rounded-lg border border-border/60 bg-panel-2/60 p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cityColor(c.name) }} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight text-foreground">{c.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{c.province}</span>
                </span>
              </div>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Coordinates</dt>
                  <dd className="tabular text-foreground">
                    {c.latitude.toFixed(2)}°N, {c.longitude.toFixed(2)}°E
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Elevation</dt>
                  <dd className="tabular text-foreground">{fmtInt(c.elevationM)} m</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">Climate</dt>
                  <dd className="text-right text-foreground">{c.climate}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </PanelCard>

      {/* ETL pipeline */}
      <div className="space-y-2">
        <PanelCard
          icon={Workflow}
          title="ETL Pipeline"
          subtitle="From raw API extraction to the analytics-ready SQLite database"
        >
          <div className="ww-scroll overflow-x-auto pb-1">
            <ol className="flex min-w-[1000px] items-stretch gap-1.5" aria-label="ETL pipeline workflow, left to right">
              {PIPELINE_NODES.map((node, index) => (
                <li key={node.title} className="flex flex-1 items-center gap-1.5">
                  <div className="flex h-full w-full min-w-[118px] flex-col items-center gap-2 rounded-lg border border-border/60 bg-panel-2/60 px-2.5 py-3 text-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet/20 bg-violet/10">
                      <node.icon className="h-4 w-4 text-violet" aria-hidden />
                    </span>
                    <span className="block text-xs font-semibold leading-tight text-foreground">{node.title}</span>
                    <span className="block font-mono text-[10px] leading-snug text-fog">{node.caption}</span>
                  </div>
                  {index < PIPELINE_NODES.length - 1 ? (
                    <ArrowRight className="h-4 w-4 shrink-0 text-fog" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </PanelCard>
        <p className="text-center text-xs text-muted-foreground">
          Python pipeline:{" "}
          <code className="rounded bg-violet/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-lav">python -m src.main</code>{" "}
          runs Extract → Transform → Load → EDA
        </p>
      </div>

      {/* Data source */}
      <PanelCard
        icon={Satellite}
        title="Data Source — Open-Meteo"
        subtitle="Historical Weather API · ERA5-family reanalysis archive"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          All observations come from the{" "}
          <span className="font-medium text-foreground">Open-Meteo Historical Weather API</span> (
          <span className="font-mono text-xs text-fog">archive-api.open-meteo.com</span>), a free endpoint serving the
          ERA5-family reanalysis archive. It requires no API key, and daily values are extracted for the exact grid
          point of each city.
        </p>
        <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Daily variables fetched
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WEATHER_PARAMETERS.map((param) => (
            <li
              key={param.key}
              className="flex items-center justify-between gap-3 rounded-lg bg-panel-2/60 px-3 py-2"
            >
              <span className="text-xs text-foreground">{param.label}</span>
              <span className="tabular text-[11px] text-muted-foreground">{param.unit}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-5 space-y-2">
          <li className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-aqua/70" aria-hidden />
            Daily aggregates are returned in{" "}
            <span className="font-medium text-foreground">Asia/Karachi local time</span> (UTC+05:00).
          </li>
          <li className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-lav/70" aria-hidden />
            Missing values are preserved as missing — the pipeline never fills gaps with zeros, and all aggregates skip
            nulls.
          </li>
        </ul>
      </PanelCard>

      {/* Technology stack */}
      <PanelCard
        icon={Cpu}
        title="Python Technology Stack"
        subtitle="Tooling used by the extraction, transformation and analysis pipeline"
      >
        <ul className="flex flex-wrap gap-2">
          {STACK_CHIPS.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-border/60 bg-panel-2/60 px-3 py-1 text-xs text-foreground"
            >
              {chip}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Cleaning, aggregation and static chart generation run entirely in Python; the dashboard reads only the
          finished SQLite database and CSV artifacts through its API layer.
        </p>
      </PanelCard>

      {/* Limitations */}
      <PanelCard
        icon={AlertTriangle}
        iconAccent="sand"
        title="Dataset Limitations"
        subtitle="Read these caveats before drawing conclusions from the data"
      >
        <ul className="space-y-2.5">
          {DATASET_LIMITATIONS.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-sand/70" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
