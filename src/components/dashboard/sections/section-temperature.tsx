"use client";

/**
 * TEMPERATURE ANALYSIS — monthly max/min/mean trends, city comparison,
 * yearly 2024 vs 2025 comparison, and extreme days.
 */

import { useState } from "react";
import { Flame, Snowflake, Thermometer } from "lucide-react";
import { BarSeriesChart, ChartCard, LineSeriesChart } from "@/components/charts/chart-kit";
import {
  ChartSkeleton,
  DeltaChip,
  ErrorState,
  SectionBody,
  SectionHeader,
} from "@/components/dashboard/ui-bits";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboard } from "@/lib/store";
import { useExtremes, useMonthly, useSummary, useYearly } from "@/hooks/use-weather";
import { ALL_CITIES_LABEL } from "@/lib/weather/aggregate";
import { cityColor, fmtDate, fmtTemp } from "@/lib/weather/format";
import { CITY_NAMES } from "@/lib/weather/types";

type MetricId = "avgTempMax" | "avgTempMin" | "avgTempMean";

const METRICS: { id: MetricId; label: string; color: string; series: string }[] = [
  { id: "avgTempMax", label: "Max", color: "#F0B429", series: "Daily max temperature" },
  { id: "avgTempMean", label: "Mean", color: "#E8925A", series: "Daily mean temperature" },
  { id: "avgTempMin", label: "Min", color: "#8B7CF6", series: "Daily min temperature" },
];

export default function SectionTemperature() {
  const cityFilter = useDashboard((s) => s.cityFilter);
  const citiesParam = cityFilter === "all" ? CITY_NAMES.join(",") : cityFilter;

  const [metric, setMetric] = useState<MetricId>("avgTempMean");
  const activeMetric = METRICS.find((m) => m.id === metric)!;

  const monthly = useMonthly(citiesParam);
  const yearly = useYearly(citiesParam);
  const extremes = useExtremes(citiesParam);
  const { data: summary } = useSummary();

  const monthlyData = monthly.data;

  // Trend series: one line per city (+ dashed 5-city average when viewing all)
  const trendSeries =
    (monthlyData?.series ?? []).map((s) => ({
      key: s.city,
      label: s.city === ALL_CITIES_LABEL ? "5-city average" : s.city,
      color: s.city === ALL_CITIES_LABEL ? "#6C4DE0" : cityColor(s.city),
      strokeWidth: s.city === ALL_CITIES_LABEL ? 2.5 : 1.8,
      dashed: s.city === ALL_CITIES_LABEL,
    })) ?? [];

  const trendData = (() => {
    // merge city points onto shared rows keyed by month label
    if (!monthlyData) return [];
    const rows: Record<string, unknown>[] = [];
    const labels = monthlyData.months.map((m) => m);
    const byCity = new Map(monthlyData.series.map((s) => [s.city, new Map(s.points.map((p) => [p.month, p]))]));
    for (const month of labels) {
      const row: Record<string, unknown> = { month };
      for (const [city, points] of byCity) {
        const p = points.get(month);
        if (p) {
          row.label = p.label;
          row[city] = p[metric];
        }
      }
      rows.push(row);
    }
    return rows;
  })();

  // City comparison bars (avg per city for all three metrics)
  const comparisonData = (summary?.cities ?? [])
    .filter((c) => cityFilter === "all" || c.city === cityFilter)
    .map((c) => ({
      city: c.city,
      avgTempMax: c.avgTempMax,
      avgTempMean: c.avgTempMean,
      avgTempMin: c.avgTempMin,
    }));

  // Yearly comparison (2024 vs 2025) for the selected metric
  const yearlyByCity = (yearly.data?.series ?? []).map((s) => {
    const y24 = s.points.find((p) => p.year === 2024)?.[metric] ?? null;
    const y25 = s.points.find((p) => p.year === 2025)?.[metric] ?? null;
    return { city: s.city, y2024: y24, y2025: y25, delta: y24 != null && y25 != null ? y25 - y24 : null };
  });

  return (
    <SectionBody>
      <SectionHeader
        title="Temperature Analysis"
        subtitle="Daily maximum, minimum and mean temperature — monthly trends, city comparison and year-over-year change"
        actions={
          <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricId)}>
            <TabsList className="bg-panel-2/70">
              {METRICS.map((m) => (
                <TabsTrigger key={m.id} value={m.id} className="gap-1.5 px-3 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} aria-hidden />
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {/* Monthly trend */}
      <ChartCard
        title={`Monthly ${activeMetric.series} Trend`}
        subtitle={
          cityFilter === "all"
            ? "Per-city monthly averages with dashed 5-city average · 2024–2025 · click legend to toggle series"
            : `Monthly averages for ${cityFilter} · 2024–2025`
        }
      >
        {monthly.isLoading ? (
          <ChartSkeleton height={400} />
        ) : monthly.isError ? (
          <ErrorState message={monthly.error?.message ?? "Failed to load monthly data."} onRetry={() => monthly.refetch()} />
        ) : (
          <LineSeriesChart
            data={trendData as Record<string, unknown>[]}
            series={trendSeries}
            xKey="label"
            height={400}
            unit="°C"
          />
        )}
      </ChartCard>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* City comparison */}
        <ChartCard
          title="City-to-City Comparison"
          subtitle="Overall averages per city across all three temperature measures"
        >
          {monthly.isLoading ? (
            <ChartSkeleton height={330} />
          ) : (
            <BarSeriesChart
              data={comparisonData as unknown as Record<string, unknown>[]}
              series={[
                { key: "avgTempMax", label: "Avg max (°C)", color: "#F0B429", barSize: 14 },
                { key: "avgTempMean", label: "Avg mean (°C)", color: "#E8925A", barSize: 14 },
                { key: "avgTempMin", label: "Avg min (°C)", color: "#8B7CF6", barSize: 14 },
              ]}
              xKey="city"
              height={330}
              unit="°C"
              cellColorKey={undefined}
            />
          )}
        </ChartCard>

        {/* Yearly comparison */}
        <ChartCard
          title={`2024 vs 2025 — ${activeMetric.series}`}
          subtitle={`Average ${activeMetric.series.toLowerCase()} per city in each calendar year`}
        >
          {yearly.isLoading ? (
            <ChartSkeleton height={330} />
          ) : yearly.isError ? (
            <ErrorState message={yearly.error?.message ?? "Failed to load yearly data."} onRetry={() => yearly.refetch()} />
          ) : (
            <BarSeriesChart
              data={yearlyByCity as unknown as Record<string, unknown>[]}
              series={[
                { key: "y2024", label: "2024", color: "#6B6787", barSize: 16 },
                { key: "y2025", label: "2025", color: activeMetric.color, barSize: 16 },
              ]}
              xKey="city"
              height={330}
              unit="°C"
              valueLabels={{ y2024: "2024", y2025: "2025" }}
            />
          )}
        </ChartCard>
      </div>

      {/* Delta chips + extremes */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Year-over-Year Change"
          subtitle={`2025 minus 2024 average ${activeMetric.series.toLowerCase()} per city`}
        >
          {yearly.isLoading ? (
            <ChartSkeleton height={210} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {yearlyByCity.map((row) => (
                <div key={row.city} className="rounded-lg border border-border/60 bg-panel-2/50 px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: cityColor(row.city) }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cityColor(row.city) }} aria-hidden />
                    {row.city}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <DeltaChip value={row.delta} />
                  </div>
                  <div className="tabular mt-1.5 text-[11px] text-muted-foreground">
                    {fmtTemp(row.y2024, false)}° → {fmtTemp(row.y2025, false)}°
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Record Days" subtitle="The eight most extreme daily observations in the current selection">
          {extremes.isLoading ? (
            <ChartSkeleton height={210} />
          ) : extremes.isError ? (
            <ErrorState message={extremes.error?.message ?? "Failed to load extremes."} onRetry={() => extremes.refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ExtremeList
                icon={Flame}
                title="Hottest days"
                color="#F0B429"
                rows={extremes.data?.hottestDays ?? []}
                format={(v) => `${v.toFixed(1)}°C`}
              />
              <ExtremeList
                icon={Snowflake}
                title="Coldest days"
                color="#8B7CF6"
                rows={extremes.data?.coldestDays ?? []}
                format={(v) => `${v.toFixed(1)}°C`}
              />
            </div>
          )}
        </ChartCard>
      </div>
    </SectionBody>
  );
}

function ExtremeList({
  icon: Icon,
  title,
  color,
  rows,
  format,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  color: string;
  rows: { city: string; date: string; value: number }[];
  format: (v: number) => string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-panel-2/40 p-3.5">
      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
        {title}
      </div>
      <ul className="space-y-1.5">
        {rows.slice(0, 4).map((row, i) => (
          <li key={`${row.city}-${row.date}`} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="tabular w-4 text-[10px] text-muted-foreground/70">{i + 1}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cityColor(row.city) }} aria-hidden />
              <span className="truncate text-secondary-foreground">{row.city}</span>
            </span>
            <span className="tabular shrink-0 text-muted-foreground">{fmtDate(row.date)}</span>
            <span className="tabular shrink-0 font-semibold" style={{ color }}>
              {format(row.value)}
            </span>
          </li>
        ))}
        {rows.length === 0 ? <li className="text-xs text-muted-foreground">No data.</li> : null}
      </ul>
    </div>
  );
}
