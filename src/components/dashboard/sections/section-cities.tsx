"use client";

/**
 * CITY INTELLIGENCE — five city profiles, detailed analytics per city,
 * and side-by-side comparison.
 */

import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarRange,
  CloudRain,
  Compass,
  MapPin,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  AreaSeriesChart,
  BarSeriesChart,
  ChartCard,
  LineSeriesChart,
} from "@/components/charts/chart-kit";
import {
  ChartSkeleton,
  ErrorState,
  SectionBody,
  SectionHeader,
  StatTile,
} from "@/components/dashboard/ui-bits";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/store";
import { useDaily, useMonthly, useSummary, useYearly } from "@/hooks/use-weather";
import { cityColor, fmtDate, fmtInt, fmtKmh, fmtMm, fmtTemp } from "@/lib/weather/format";
import { CITIES_META, CITY_NAMES } from "@/lib/weather/types";
import { ALL_CITIES_LABEL } from "@/lib/weather/aggregate";
import { cn } from "@/lib/utils";

export default function SectionCities() {
  const activeCity = useDashboard((s) => s.activeCity);
  const closeCity = useDashboard((s) => s.closeCity);
  const openCity = useDashboard((s) => s.openCity);

  const { data, isLoading, isError, error, refetch } = useSummary();

  if (isError) {
    return (
      <SectionBody>
        <SectionHeader title="City Intelligence" subtitle="Per-city climate profiles and comparison" />
        <ErrorState message={error?.message ?? "Failed to load city statistics."} onRetry={() => refetch()} />
      </SectionBody>
    );
  }

  if (activeCity) {
    return <CityDetail city={activeCity} summary={data?.cities.find((c) => c.city === activeCity) ?? null} onBack={closeCity} />;
  }

  return (
    <SectionBody>
      <SectionHeader
        title="City Intelligence"
        subtitle="Five monitored cities across Pakistan — open a city for detailed analytics or compare them side by side"
      />

      {/* City cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {!isLoading && data
          ? data.cities.map((stat) => <CityCard key={stat.city} stat={stat} onOpen={() => openCity(stat.city)} />)
          : Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/80 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-violet/[0.07]" />
                  <div>
                    <div className="h-4 w-28 rounded bg-violet/[0.07]" />
                    <div className="mt-1.5 h-3 w-20 rounded bg-violet/[0.07]" />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <div key={j} className="h-16 rounded-lg bg-violet/[0.05]" />
                  ))}
                </div>
              </div>
            ))}
      </div>

      {/* Comparison */}
      {data ? <CityComparison stats={data.cities} /> : null}
    </SectionBody>
  );
}

// ---------- city card ----------

function CityCard({ stat, onOpen }: { stat: import("@/lib/weather/api-types").CityStat; onOpen: () => void }) {
  const meta = CITIES_META.find((m) => m.name === stat.city);
  const color = cityColor(stat.city);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(43,35,80,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet/30">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border" style={{ borderColor: `${color}40`, backgroundColor: `${color}1a` }}>
            <MapPin className="h-4.5 w-4.5" style={{ color }} aria-hidden />
          </span>
          <div>
            <div className="text-[15px] font-semibold text-foreground">{stat.city}</div>
            <div className="text-[11px] text-muted-foreground">{meta?.province}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onOpen}>
          Analytics <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Compass className="h-3 w-3" aria-hidden />
          {meta?.latitude.toFixed(2)}°N {meta?.longitude.toFixed(2)}°E
        </span>
        <span className="inline-flex items-center gap-1">{meta?.elevationM} m elevation</span>
        <span>{meta?.climate}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile label="Avg temp" value={fmtTemp(stat.avgTempMean, false)} unit="°C" />
        <StatTile label="Max / Min" value={`${fmtTemp(stat.absMaxTemp, false)}° / ${fmtTemp(stat.absMinTemp, false)}°`} />
        <StatTile label="Precipitation" value={fmtMm(stat.totalPrecipitation, false)} unit="mm" />
        <StatTile label="Rainy days" value={fmtInt(stat.rainyDays)} hint="≥ 1 mm/day" />
        <StatTile label="Avg max wind" value={fmtKmh(stat.avgWindSpeed, false)} unit="km/h" />
        <StatTile label="Max gust" value={fmtKmh(stat.maxWindGust, false)} unit="km/h" />
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        {fmtInt(stat.records)} daily records · {fmtDate(stat.start)} → {fmtDate(stat.end)}
      </div>
    </div>
  );
}

// ---------- comparison ----------

function CityComparison({ stats }: { stats: import("@/lib/weather/api-types").CityStat[] }) {
  const [selected, setSelected] = useState<string[]>([...CITY_NAMES]);
  const selectedStats = stats.filter((s) => selected.includes(s.city));

  const toggle = (city: string) => {
    setSelected((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  };

  const comparisonRows: { label: string; get: (s: (typeof stats)[number]) => string; highlight?: "terra" | "aqua" | "lav" }[] = [
    { label: "Avg mean temp", get: (s) => fmtTemp(s.avgTempMean), highlight: "terra" },
    { label: "Avg max temp", get: (s) => fmtTemp(s.avgTempMax) },
    { label: "Avg min temp", get: (s) => fmtTemp(s.avgTempMin) },
    { label: "Hottest day", get: (s) => `${fmtTemp(s.absMaxTemp, false)}° · ${fmtDate(s.absMaxTempDate)}` },
    { label: "Coldest day", get: (s) => `${fmtTemp(s.absMinTemp, false)}° · ${fmtDate(s.absMinTempDate)}` },
    { label: "Total precipitation", get: (s) => fmtMm(s.totalPrecipitation), highlight: "lav" },
    { label: "Rainy days", get: (s) => `${fmtInt(s.rainyDays)} days` },
    { label: "Avg max wind", get: (s) => fmtKmh(s.avgWindSpeed) },
    { label: "Strongest gust", get: (s) => `${fmtKmh(s.maxWindGust, false)} · ${fmtDate(s.maxWindGustDate)}` },
    { label: "Avg gust ratio", get: (s) => (s.avgGustRatio !== null ? `${s.avgGustRatio.toFixed(2)}×` : "—") },
  ];

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">City Comparison</h2>
      <div className="rounded-xl border border-border/80 bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-5 py-3.5">
          <span className="mr-1 text-xs text-muted-foreground">Compare:</span>
          {CITY_NAMES.map((city) => {
            const active = selected.includes(city);
            return (
              <button
                key={city}
                type="button"
                onClick={() => toggle(city)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                  active ? "border-transparent text-ink" : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                )}
                style={active ? { backgroundColor: cityColor(city) } : undefined}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-ink/60" : "")} style={!active ? { backgroundColor: cityColor(city) } : undefined} aria-hidden />
                {city}
              </button>
            );
          })}
          {selectedStats.length === 0 ? (
            <span className="ml-2 text-xs text-terra">Select at least one city</span>
          ) : null}
        </div>

        {selectedStats.length > 0 ? (
          <div className="ww-scroll overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th scope="col" className="sticky left-0 z-10 bg-card px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Metric
                  </th>
                  {selectedStats.map((s) => (
                    <th key={s.city} scope="col" className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: cityColor(s.city) }}>
                      {s.city}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={row.label} className={cn("border-b border-border/40 transition-colors last:border-0 hover:bg-violet/[0.03]", idx % 2 === 1 && "bg-violet/[0.07]")}>
                    <th scope="row" className="sticky left-0 z-10 bg-card px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      {row.label}
                    </th>
                    {selectedStats.map((s) => (
                      <td key={s.city} className={cn("tabular px-4 py-2.5 text-[13px]", row.highlight === "terra" ? "text-secondary-foreground" : "text-secondary-foreground")}>
                        {row.get(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------- city detail ----------

function CityDetail({
  city,
  summary,
  onBack,
}: {
  city: string;
  summary: import("@/lib/weather/api-types").CityStat | null;
  onBack: () => void;
}) {
  const meta = CITIES_META.find((m) => m.name === city);
  const color = cityColor(city);

  const monthly = useMonthly(city);
  const yearly = useYearly(city);
  const daily = useDaily(city);

  const monthlyCity = monthly.data?.series.find((s) => s.city === city)?.points ?? [];
  const yearlyPoint = yearly.data?.series.find((s) => s.city === city)?.points ?? [];
  const y2024 = yearlyPoint.find((p) => p.year === 2024);
  const y2025 = yearlyPoint.find((p) => p.year === 2025);

  return (
    <SectionBody>
      <div className="mb-6">
        <Button variant="outline" size="sm" className="mb-4 gap-1.5 text-xs" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All cities
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{city}</h1>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {meta?.province} · {meta?.latitude.toFixed(2)}°N {meta?.longitude.toFixed(2)}°E · {meta?.elevationM} m elevation · {meta?.climate} climate
            </p>
          </div>
          {summary ? (
            <div className="tabular text-xs text-muted-foreground">
              {fmtInt(summary.records)} daily records · {fmtDate(summary.start)} → {fmtDate(summary.end)}
            </div>
          ) : null}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Avg temp" value={summary ? fmtTemp(summary.avgTempMean) : "—"} hint="daily mean" />
        <StatTile
          label="Hottest day"
          value={summary ? fmtTemp(summary.absMaxTemp, false) + "°" : "—"}
          hint={summary ? fmtDate(summary.absMaxTempDate) : undefined}
          valueClass="text-terra"
        />
        <StatTile
          label="Coldest day"
          value={summary ? fmtTemp(summary.absMinTemp, false) + "°" : "—"}
          hint={summary ? fmtDate(summary.absMinTempDate) : undefined}
          valueClass="text-aqua"
        />
        <StatTile label="Precipitation" value={summary ? fmtMm(summary.totalPrecipitation, false) : "—"} unit="mm" hint={`${fmtInt(summary?.rainyDays ?? 0)} rainy days`} />
        <StatTile label="Avg max wind" value={summary ? fmtKmh(summary.avgWindSpeed) : "—"} hint="daily maxima" />
        <StatTile
          label="Strongest gust"
          value={summary ? fmtKmh(summary.maxWindGust, false) : "—"}
          unit="km/h"
          hint={summary ? fmtDate(summary.maxWindGustDate) : undefined}
          valueClass="text-sand"
        />
      </div>

      {/* Daily temperature range */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Daily Temperature Range"
          subtitle="Daily maximum and minimum temperature across the full dataset"
        >
          {daily.isLoading ? (
            <ChartSkeleton height={330} />
          ) : daily.isError ? (
            <ErrorState message={daily.error?.message ?? "Failed to load daily data."} onRetry={() => daily.refetch()} />
          ) : (
            <LineSeriesChart
              data={(daily.data?.points ?? []) as unknown as Record<string, unknown>[]}
              series={[
                { key: "temperatureMax", label: "Daily max (°C)", color: "#F0B429", strokeWidth: 1.6 },
                { key: "temperatureMin", label: "Daily min (°C)", color: "#8B7CF6", strokeWidth: 1.6 },
              ]}
              xKey="date"
              height={330}
              unit="°C"
              xFormatter={(v) => (typeof v === "string" ? v.slice(2, 7) : String(v))}
            />
          )}
        </ChartCard>

        {/* Monthly mean temp */}
        <ChartCard title="Monthly Temperature Profile" subtitle="Average daily max, mean and min temperature per month">
          {monthly.isLoading ? (
            <ChartSkeleton height={330} />
          ) : monthly.isError ? (
            <ErrorState message={monthly.error?.message ?? "Failed to load monthly data."} onRetry={() => monthly.refetch()} />
          ) : (
            <LineSeriesChart
              data={monthlyCity as unknown as Record<string, unknown>[]}
              series={[
                { key: "avgTempMax", label: "Avg max (°C)", color: "#F0B429" },
                { key: "avgTempMean", label: "Avg mean (°C)", color: "#E8925A", strokeWidth: 2.5 },
                { key: "avgTempMin", label: "Avg min (°C)", color: "#8B7CF6" },
              ]}
              xKey="label"
              height={330}
              unit="°C"
            />
          )}
        </ChartCard>
      </div>

      {/* Monthly precipitation + wind */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Monthly Precipitation" subtitle="Total precipitation per month (mm)">
          {monthly.isLoading ? (
            <ChartSkeleton height={300} />
          ) : monthly.isError ? (
            <ErrorState message={monthly.error?.message ?? "Failed to load monthly data."} onRetry={() => monthly.refetch()} />
          ) : (
            <AreaSeriesChart
              data={monthlyCity as unknown as Record<string, unknown>[]}
              series={[{ key: "totalPrecipitation", label: "Precipitation (mm)", color: "#8B7CF6" }]}
              xKey="label"
              height={300}
              unit=" mm"
              showLegend={false}
            />
          )}
        </ChartCard>

        <ChartCard title="Monthly Wind Behaviour" subtitle="Average daily max wind speed and strongest monthly gust">
          {monthly.isLoading ? (
            <ChartSkeleton height={300} />
          ) : monthly.isError ? (
            <ErrorState message={monthly.error?.message ?? "Failed to load monthly data."} onRetry={() => monthly.refetch()} />
          ) : (
            <LineSeriesChart
              data={monthlyCity as unknown as Record<string, unknown>[]}
              series={[
                { key: "avgWindSpeed", label: "Avg max wind (km/h)", color: "#6B6787" },
                { key: "maxWindGust", label: "Max gust (km/h)", color: "#8B7CF6", dashed: true },
              ]}
              xKey="label"
              height={300}
              unit=" km/h"
            />
          )}
        </ChartCard>
      </div>

      {/* Yearly comparison */}
      <div className="mt-4">
        <ChartCard
          title="2024 vs 2025"
          subtitle="Year-over-year climate summary for this city"
          footer={
            y2024 && y2025
              ? "Deltas computed from the same month windows across both calendar years. Precipitation varies strongly between monsoon seasons."
              : undefined
          }
        >
          {!yearly.data ? (
            <ChartSkeleton height={280} />
          ) : yearly.isError ? (
            <ErrorState message={yearly.error?.message ?? "Failed to load yearly data."} onRetry={() => yearly.refetch()} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <StatTile label="2024 avg temp" value={fmtTemp(y2024?.avgTempMean ?? null)} hint={`vs ${fmtTemp(y2025?.avgTempMean ?? null)} in 2025`} />
              <StatTile
                label="Δ temperature"
                value={y2024?.avgTempMean != null && y2025?.avgTempMean != null ? `${(y2025.avgTempMean - y2024.avgTempMean >= 0 ? "+" : "") + (y2025.avgTempMean - y2024.avgTempMean).toFixed(1)}°C` : "—"}
                valueClass={y2024?.avgTempMean != null && y2025?.avgTempMean != null && y2025.avgTempMean > y2024.avgTempMean ? "text-terra" : "text-aqua"}
                hint="2025 − 2024"
              />
              <StatTile label="2024 precipitation" value={fmtMm(y2024?.totalPrecipitation ?? null, false)} unit="mm" hint={`vs ${fmtMm(y2025?.totalPrecipitation ?? null, false)} mm in 2025`} />
              <StatTile
                label="Δ precipitation"
                value={y2024?.totalPrecipitation != null && y2025?.totalPrecipitation != null ? `${y2025.totalPrecipitation - y2024.totalPrecipitation >= 0 ? "+" : ""}${(y2025.totalPrecipitation - y2024.totalPrecipitation).toFixed(0)} mm` : "—"}
                valueClass="text-lav"
                hint="2025 − 2024"
              />
              <StatTile label="2024 avg wind" value={fmtKmh(y2024?.avgWindSpeed ?? null)} hint={`vs ${fmtKmh(y2025?.avgWindSpeed ?? null)} in 2025`} />
              <StatTile label="2024 rainy days" value={fmtInt(y2024?.rainyDays ?? 0)} hint={`${fmtInt(y2025?.rainyDays ?? 0)} days in 2025`} />
            </div>
          )}
        </ChartCard>
      </div>
    </SectionBody>
  );
}
