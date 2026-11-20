"use client";

/**
 * OVERVIEW — Pakistan Climate Overview.
 * KPIs, Pakistan map, monthly temperature trend, per-city comparisons
 * and city overview cards. All values are computed from the dataset.
 */

import { ArrowUpRight, CalendarRange, CloudRain, Database, MapPin, Thermometer, Wind } from "lucide-react";
import { PakistanMap } from "@/components/charts/pakistan-map";
import { BarSeriesChart, ChartCard, LineSeriesChart } from "@/components/charts/chart-kit";
import {
  ChartSkeleton,
  ErrorState,
  KpiCard,
  KpiSkeletonGrid,
  SectionBody,
  SectionHeader,
} from "@/components/dashboard/ui-bits";
import { useDashboard } from "@/lib/store";
import { useSummary } from "@/hooks/use-weather";
import { ALL_CITIES_LABEL } from "@/lib/weather/aggregate";
import { fmtDate, fmtDateRange, fmtInt, fmtKmh, fmtMm, fmtTemp } from "@/lib/weather/format";
import { CITIES_META, CITY_NAMES } from "@/lib/weather/types";
import { cityColor } from "@/lib/weather/format";
import type { MonthlyResponse } from "@/lib/weather/api-types";
import { useMonthly } from "@/hooks/use-weather";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const citiesParam = CITY_NAMES.join(",");

export default function SectionOverview() {
  const openCity = useDashboard((s) => s.openCity);
  const { data, isLoading, isError, error, refetch } = useSummary();

  const monthly = useMonthly(citiesParam);
  const monthlyData: MonthlyResponse | undefined = monthly.data;

  const cityStats = data
    ? Object.fromEntries(data.cities.map((c) => [c.city, c]))
    : null;

  // monthly temperature trend: one series per city (or the single filtered city)
  const monthlyTrendSeries = useMemoSeries(monthlyData);

  const cityBarData = (data?.cities ?? []).map((c) => ({
    city: c.city,
    avgTempMean: c.avgTempMean,
    totalPrecipitation: c.totalPrecipitation,
    avgWindSpeed: c.avgWindSpeed,
  }));

  return (
    <SectionBody>
      <SectionHeader
        title="Pakistan Climate Overview"
        subtitle="Historical Weather Intelligence Across Five Major Cities | 2024–2025"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => openCity(CITY_NAMES[0])}
          >
            Explore cities <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        }
      />

      {/* KPI row — hero strip with subtle radial violet glow */}
      {isError ? (
        <ErrorState message={error?.message ?? "Failed to load dataset summary."} onRetry={() => refetch()} />
      ) : (
        <div className="ww-hero-glow grid grid-cols-1 gap-4 rounded-xl sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={MapPin}
            label="Cities Monitored"
            value={data ? String(data.kpis.cityCount) : "5"}
            sub={data ? "Lahore · Karachi · Islamabad · Peshawar · Quetta" : undefined}
            accent="violet"
          />
          <KpiCard
            icon={Database}
            label="Total Weather Records"
            value={data ? fmtInt(data.kpis.totalRecords) : "—"}
            sub={data ? `${fmtInt(data.kpis.daysPerCity)} daily observations per city` : undefined}
            accent="lav"
            loading={!data}
          />
          <KpiCard
            icon={CalendarRange}
            label="Dataset Duration"
            value={data ? `${data.kpis.start.slice(0, 4)}–${data.kpis.end.slice(0, 4)}` : "—"}
            sub={data ? `${fmtDate(data.kpis.start)} → ${fmtDate(data.kpis.end)}` : undefined}
            accent="aqua"
            loading={!data}
          />
          <KpiCard
            icon={Thermometer}
            label="Weather Parameters"
            value={data ? String(data.kpis.parameterCount) : "7"}
            sub="Temperature ×3 · Precipitation ×2 · Wind ×2"
            accent="sand"
          />
        </div>
      )}

      {/* Map + monthly trend */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-2"
          title="Monitored Cities"
          subtitle="Stylized geographic view — click a marker to open city analytics"
        >
          <div className="rounded-xl border border-border/50 bg-violet/[0.05] px-3 py-2">
            <PakistanMap cityStats={cityStats} onSelectCity={openCity} height={400} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {(data?.cities ?? CITIES_META.map((m) => ({ city: m.name } as never))).map((c) => (
              <button
                key={c.city}
                type="button"
                onClick={() => openCity(c.city)}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-secondary-foreground transition-colors hover:bg-violet/[0.07]"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cityColor(c.city) }} aria-hidden />
                {c.city}
                {cityStats?.[c.city]?.avgTempMean != null ? (
                  <span className="tabular text-muted-foreground">
                    {fmtTemp(cityStats[c.city].avgTempMean, false)}°C
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          className="lg:col-span-3"
          title="Monthly Temperature Trend"
          subtitle="Average daily mean temperature per month · all five cities, 2024–2025"
        >
          {monthly.isLoading ? (
            <ChartSkeleton height={420} />
          ) : monthly.isError ? (
            <ErrorState message={monthly.error?.message ?? "Failed to load monthly trends."} onRetry={() => monthly.refetch()} />
          ) : (
            <LineSeriesChart
              data={(monthlyData?.series ?? []).find((s) => s.city === ALL_CITIES_LABEL)?.points as unknown as Record<string, unknown>[] ?? []}
              series={[
                { key: "avgTempMean", label: "5-city average mean temperature", color: "#6C4DE0", strokeWidth: 2.5 },
              ]}
              xKey="label"
              height={420}
              unit="°C"
              showLegend={false}
            />
          )}
        </ChartCard>
      </div>

      {/* City comparisons */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Average Temperature" subtitle="Overall daily mean per city (°C) · 2024–2025">
          {!data ? (
            <ChartSkeleton height={280} />
          ) : (
            <BarSeriesChart
              data={cityBarData as unknown as Record<string, unknown>[]}
              series={[{ key: "avgTempMean", label: "Avg temperature (°C)", color: "#8B7CF6", barSize: 34 }]}
              xKey="city"
              height={280}
              unit="°C"
              cellColorKey="city"
              showLegend={false}
              yFormatter={(v) => `${v.toFixed(0)}°`}
            />
          )}
        </ChartCard>

        <ChartCard title="Total Precipitation" subtitle="Cumulative precipitation per city (mm) · 2024–2025">
          {!data ? (
            <ChartSkeleton height={280} />
          ) : (
            <BarSeriesChart
              data={cityBarData as unknown as Record<string, unknown>[]}
              series={[{ key: "totalPrecipitation", label: "Total precipitation (mm)", color: "#56C9B4", barSize: 34 }]}
              xKey="city"
              height={280}
              unit=" mm"
              cellColorKey="city"
              showLegend={false}
              yFormatter={(v) => `${v.toFixed(0)}`}
            />
          )}
        </ChartCard>

        <ChartCard title="Average Max Wind Speed" subtitle="Mean of daily maximum wind speed (km/h) · 2024–2025">
          {!data ? (
            <ChartSkeleton height={280} />
          ) : (
            <BarSeriesChart
              data={cityBarData as unknown as Record<string, unknown>[]}
              series={[{ key: "avgWindSpeed", label: "Avg max wind speed (km/h)", color: "#6B6787", barSize: 34 }]}
              xKey="city"
              height={280}
              unit=" km/h"
              cellColorKey="city"
              showLegend={false}
              yFormatter={(v) => `${v.toFixed(0)}`}
            />
          )}
        </ChartCard>
      </div>

      {/* City overview cards */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        City Overview
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {!data
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/80 bg-card p-5">
                <Skeleton className="h-5 w-24 bg-violet/[0.07]" />
                <Skeleton className="mt-4 h-3 w-32 bg-violet/[0.07]" />
                <Skeleton className="mt-4 h-9 w-full bg-violet/[0.05]" />
              </div>
            ))
          : data.cities.map((c) => {
              const meta = CITIES_META.find((m) => m.name === c.city);
              return (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => openCity(c.city)}
                  className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-violet/30"
                  aria-label={`Open detailed analytics for ${c.city}`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${cityColor(c.city)}, transparent)` }}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[15px] font-semibold text-foreground">{c.city}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {meta?.province ?? ""} · {meta?.latitude.toFixed(2)}°N {meta?.longitude.toFixed(2)}°E
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-fog transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet" aria-hidden />
                  </div>
                  <div className="tabular mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-panel-2/60 px-1 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg</div>
                      <div className="mt-0.5 text-sm font-semibold text-foreground">{fmtTemp(c.avgTempMean, false)}°</div>
                    </div>
                    <div className="rounded-lg bg-panel-2/60 px-1 py-2">
                      <div className="flex items-center justify-center gap-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        <CloudRain className="h-2.5 w-2.5" aria-hidden /> Rain
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-foreground">{fmtMm(c.totalPrecipitation, false)}</div>
                    </div>
                    <div className="rounded-lg bg-panel-2/60 px-1 py-2">
                      <div className="flex items-center justify-center gap-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        <Wind className="h-2.5 w-2.5" aria-hidden /> Wind
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-foreground">{fmtKmh(c.avgWindSpeed, false)}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    Extremes: {fmtTemp(c.absMaxTemp, false)}° / {fmtTemp(c.absMinTemp, false)}°
                  </div>
                </button>
              );
            })}
      </div>

      {data ? (
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Dataset window {fmtDateRange(data.kpis.start, data.kpis.end)} · {fmtInt(data.kpis.totalRecords)} daily records
          · Source: {data.meta.source} · Timezone {data.meta.timezone}. All statistics are computed directly from
          the cleaned ETL output — no hardcoded values.
        </p>
      ) : null}
    </SectionBody>
  );
}

function useMemoSeries(monthlyData: MonthlyResponse | undefined) {
  return monthlyData?.series ?? [];
}
