"use client";

/**
 * WIND ANALYSIS — average daily max wind by city, gust comparison,
 * monthly trends and a metric radar comparison.
 */

import { Activity, Gauge, Wind, Zap } from "lucide-react";
import { BarSeriesChart, ChartCard, RadarSeriesChart } from "@/components/charts/chart-kit";
import {
  ChartSkeleton,
  ErrorState,
  KpiCard,
  KpiSkeletonGrid,
  SectionBody,
  SectionHeader,
  StatTile,
} from "@/components/dashboard/ui-bits";
import { useDashboard } from "@/lib/store";
import { useExtremes, useMonthly, useSummary } from "@/hooks/use-weather";
import { ALL_CITIES_LABEL } from "@/lib/weather/aggregate";
import { cityColor, fmtDate, fmtKmh } from "@/lib/weather/format";
import { CITY_NAMES } from "@/lib/weather/types";

export default function SectionWind() {
  const cityFilter = useDashboard((s) => s.cityFilter);
  const citiesParam = cityFilter === "all" ? CITY_NAMES.join(",") : cityFilter;

  const { data: summary, isLoading: summaryLoading, isError: summaryError, error, refetch } = useSummary();
  const monthly = useMonthly(citiesParam);
  const extremes = useExtremes(citiesParam);

  const selectedStats = (summary?.cities ?? []).filter((c) => cityFilter === "all" || c.city === cityFilter);
  const windiest = [...selectedStats].sort((a, b) => (b.avgWindSpeed ?? 0) - (a.avgWindSpeed ?? 0))[0];
  const calmest = [...selectedStats].sort((a, b) => (a.avgWindSpeed ?? 99) - (b.avgWindSpeed ?? 99))[0];
  const avgGustRatio = selectedStats.length
    ? selectedStats.reduce((s, c) => s + (c.avgGustRatio ?? 0), 0) / selectedStats.length
    : null;

  const cityBarData = selectedStats.map((c) => ({
    city: c.city,
    avgWindSpeed: c.avgWindSpeed,
    avgWindGusts: c.avgWindGusts,
    maxWindSpeed: c.maxWindSpeed,
    maxWindGust: c.maxWindGust,
  }));

  // monthly trend rows
  const trendRows = (() => {
    if (!monthly.data) return [];
    const rows: Record<string, unknown>[] = [];
    const byCity = new Map(
      monthly.data.series.filter((s) => s.city !== ALL_CITIES_LABEL).map((s) => [s.city, new Map(s.points.map((p) => [p.month, p]))])
    );
    for (const month of monthly.data.months) {
      const row: Record<string, unknown> = { month };
      for (const [city, points] of byCity) {
        const p = points.get(month);
        if (p) {
          row.label = p.label;
          row[city] = p.avgWindSpeed;
        }
      }
      rows.push(row);
    }
    return rows;
  })();

  const trendSeries =
    (monthly.data?.series ?? [])
      .filter((s) => s.city !== ALL_CITIES_LABEL)
      .map((s) => ({ key: s.city, label: s.city, color: cityColor(s.city), strokeWidth: 1.8 })) ?? [];

  // radar: metrics as axes, cities as series
  const radarData = [
    { metric: "Avg wind", avgWindSpeed: 0, maxWindSpeed: 0, avgGust: 0, maxGust: 0 },
    { metric: "Max wind", avgWindSpeed: 0, maxWindSpeed: 0, avgGust: 0, maxGust: 0 },
    { metric: "Avg gust", avgWindSpeed: 0, maxWindSpeed: 0, avgGust: 0, maxGust: 0 },
    { metric: "Max gust", avgWindSpeed: 0, maxWindSpeed: 0, avgGust: 0, maxGust: 0 },
  ];
  const radarValueFor = (stat: (typeof selectedStats)[number]) => [stat.avgWindSpeed, stat.maxWindSpeed, stat.avgWindGusts, stat.maxWindGust];
  for (let i = 0; i < radarData.length; i++) {
    for (const stat of selectedStats) {
      const value = radarValueFor(stat)[i];
      if (value != null) radarData[i][stat.city] = value;
    }
  }

  if (summaryError) {
    return (
      <SectionBody>
        <SectionHeader title="Wind Analysis" subtitle="Maximum wind speed and gust behaviour across cities" />
        <ErrorState message={error?.message ?? "Failed to load dataset summary."} onRetry={() => refetch()} />
      </SectionBody>
    );
  }

  return (
    <SectionBody>
      <SectionHeader
        title="Wind Analysis"
        subtitle="Daily maximum wind speed and gusts — averages, records, monthly behaviour and city radar"
      />

      {/* KPIs */}
      {summaryLoading || !summary ? (
        <KpiSkeletonGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Wind}
            label="Windiest city"
            value={windiest?.city ?? "—"}
            sub={windiest ? `${fmtKmh(windiest.avgWindSpeed)} average daily max` : undefined}
            accent="violet"
          />
          <KpiCard
            icon={Zap}
            label="Strongest gust recorded"
            value={extremes.data?.extremes.windiestGust ? fmtKmh(extremes.data.extremes.windiestGust.value, false) : "—"}
            sub={
              extremes.data?.extremes.windiestGust
                ? `${extremes.data.extremes.windiestGust.city} · ${fmtDate(extremes.data.extremes.windiestGust.date)}`
                : undefined
            }
            accent="sand"
          />
          <KpiCard
            icon={Gauge}
            label="Calmest city"
            value={calmest?.city ?? "—"}
            sub={calmest ? `${fmtKmh(calmest.avgWindSpeed)} average daily max` : undefined}
            accent="lav"
          />
          <KpiCard
            icon={Activity}
            label="Avg gust factor"
            value={avgGustRatio !== null ? `${avgGustRatio.toFixed(2)}×` : "—"}
            sub="Mean ratio of gust speed to sustained wind"
            accent="aqua"
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Average wind */}
        <ChartCard title="Average Daily Max Wind Speed" subtitle="Mean of daily wind_speed_10m_max per city (km/h)">
          {summaryLoading ? (
            <ChartSkeleton height={320} />
          ) : (
            <BarSeriesChart
              data={cityBarData as unknown as Record<string, unknown>[]}
              series={[{ key: "avgWindSpeed", label: "Avg max wind (km/h)", color: "#6B6787", barSize: 30 }]}
              xKey="city"
              height={320}
              unit=" km/h"
              cellColorKey="city"
              showLegend={false}
            />
          )}
        </ChartCard>

        {/* Gust comparison */}
        <ChartCard title="Maximum Wind Gust Comparison" subtitle="Strongest recorded gust per city (km/h)">
          {summaryLoading ? (
            <ChartSkeleton height={320} />
          ) : (
            <BarSeriesChart
              data={cityBarData as unknown as Record<string, unknown>[]}
              series={[{ key: "maxWindGust", label: "Max gust (km/h)", color: "#8B7CF6", barSize: 30 }]}
              xKey="city"
              height={320}
              unit=" km/h"
              cellColorKey="city"
              showLegend={false}
            />
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Monthly trends */}
        <ChartCard
          title="Monthly Wind Speed Trends"
          subtitle={cityFilter === "all" ? "Average daily max wind per month per city (km/h)" : `Monthly wind for ${cityFilter} (km/h)`}
        >
          {monthly.isLoading ? (
            <ChartSkeleton height={330} />
          ) : monthly.isError ? (
            <ErrorState message={monthly.error?.message ?? "Failed to load monthly data."} onRetry={() => monthly.refetch()} />
          ) : (
            <BarSeriesChart
              data={trendRows as Record<string, unknown>[]}
              series={trendSeries.map((s) => ({ ...s, barSize: 7 }))}
              xKey="label"
              height={330}
              unit=" km/h"
            />
          )}
        </ChartCard>

        {/* Radar comparison */}
        <ChartCard
          title="City Wind Profile Radar"
          subtitle="Four wind metrics per city — toggle cities in the legend to focus the comparison"
        >
          {summaryLoading ? (
            <ChartSkeleton height={330} />
          ) : (
            <RadarSeriesChart
              data={radarData as unknown as Record<string, unknown>[]}
              series={selectedStats.map((s) => ({ key: s.city, label: s.city, color: cityColor(s.city) }))}
              xKey="metric"
              height={330}
              unit=" km/h"
            />
          )}
        </ChartCard>
      </div>

      {/* Gust behaviour detail */}
      <div className="mt-4">
        <ChartCard
          title="Gust Behaviour by City"
          subtitle="Sustained vs gust speeds and their relationship — gust factor = gust ÷ sustained"
        >
          {summaryLoading ? (
            <ChartSkeleton height={210} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {selectedStats.map((s) => (
                <div key={s.city} className="rounded-lg border border-border/60 bg-panel-2/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cityColor(s.city) }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cityColor(s.city) }} aria-hidden />
                    {s.city}
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Avg wind</span>
                      <span className="tabular font-medium text-foreground">{fmtKmh(s.avgWindSpeed, false)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Avg gust</span>
                      <span className="tabular font-medium text-foreground">{fmtKmh(s.avgWindGusts, false)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Max gust</span>
                      <span className="tabular font-medium text-sand">{fmtKmh(s.maxWindGust, false)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-1.5 text-[11px]">
                      <span className="text-muted-foreground">Gust factor</span>
                      <span className="tabular font-semibold text-lav">{s.avgGustRatio !== null ? `${s.avgGustRatio.toFixed(2)}×` : "—"}</span>
                    </div>
                  </div>
                  <div className="mt-2 truncate text-[10px] text-muted-foreground/80" title={s.maxWindSpeedDate ?? undefined}>
                    Peak sustained {fmtKmh(s.maxWindSpeed, false)} · {fmtDate(s.maxWindSpeedDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Strongest gust days */}
      <div className="mt-4">
        <ChartCard title="Strongest Gust Days" subtitle="The eight highest gust observations in the current selection">
          {extremes.isLoading ? (
            <ChartSkeleton height={190} />
          ) : extremes.isError ? (
            <ErrorState message={extremes.error?.message ?? "Failed to load extremes."} onRetry={() => extremes.refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {(extremes.data?.windiestDays ?? []).slice(0, 8).map((row, i) => (
                <div key={`${row.city}-${row.date}`} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-panel-2/40 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="tabular w-4 text-[10px] text-muted-foreground/70">{i + 1}</span>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cityColor(row.city) }} aria-hidden />
                    <span className="truncate text-xs text-secondary-foreground">{row.city}</span>
                  </span>
                  <span className="tabular shrink-0 text-[11px] text-muted-foreground">{fmtDate(row.date)}</span>
                  <span className="tabular shrink-0 text-xs font-semibold text-sand">{fmtKmh(row.value, false)}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </SectionBody>
  );
}
