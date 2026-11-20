"use client";

/**
 * PRECIPITATION ANALYSIS — totals by city, monthly trends, 2024 vs 2025,
 * and a precipitation ranking with share bars.
 */

import { CloudRain, Droplets, Trophy, Umbrella } from "lucide-react";
import { AreaSeriesChart, BarSeriesChart, ChartCard, ComboChart } from "@/components/charts/chart-kit";
import {
  ChartSkeleton,
  DeltaChip,
  ErrorState,
  KpiCard,
  KpiSkeletonGrid,
  SectionBody,
  SectionHeader,
} from "@/components/dashboard/ui-bits";
import { useDashboard } from "@/lib/store";
import { useExtremes, useMonthly, useSummary, useYearly } from "@/hooks/use-weather";
import { cityColor, fmtDate, fmtInt, fmtMm } from "@/lib/weather/format";
import { CITY_NAMES } from "@/lib/weather/types";

export default function SectionPrecipitation() {
  const cityFilter = useDashboard((s) => s.cityFilter);
  const citiesParam = cityFilter === "all" ? CITY_NAMES.join(",") : cityFilter;

  const { data: summary, isLoading: summaryLoading, isError: summaryError, error, refetch } = useSummary();
  const monthly = useMonthly(citiesParam);
  const yearly = useYearly(citiesParam);
  const extremes = useExtremes(citiesParam);

  const selectedStats = (summary?.cities ?? []).filter((c) => cityFilter === "all" || c.city === cityFilter);

  const combinedTotal = selectedStats.reduce((s, c) => s + (c.totalPrecipitation ?? 0), 0);
  const combinedRain = selectedStats.reduce((s, c) => s + (c.totalRain ?? 0), 0);
  const wettestCity = [...selectedStats].sort((a, b) => (b.totalPrecipitation ?? 0) - (a.totalPrecipitation ?? 0))[0];
  const avgRainyDays = selectedStats.length
    ? selectedStats.reduce((s, c) => s + c.rainyDays, 0) / selectedStats.length
    : 0;
  const avgRainShare = combinedTotal ? (combinedRain / combinedTotal) * 100 : 0;

  const cityBarData = selectedStats.map((c) => ({
    city: c.city,
    totalPrecipitation: c.totalPrecipitation,
    totalRain: c.totalRain,
  }));

  const trendRows = (() => {
    if (!monthly.data) return [];
    const rows: Record<string, unknown>[] = [];
    const byCity = new Map(monthly.data.series.map((s) => [s.city, new Map(s.points.map((p) => [p.month, p]))]));
    for (const month of monthly.data.months) {
      const row: Record<string, unknown> = { month };
      for (const [city, points] of byCity) {
        const p = points.get(month);
        if (p) {
          row.label = p.label;
          row[city] = p.totalPrecipitation;
        }
      }
      rows.push(row);
    }
    return rows;
  })();

  const trendSeries =
    (monthly.data?.series ?? [])
      .filter((s) => s.city !== "All Cities (avg)")
      .map((s) => ({ key: s.city, label: s.city, color: cityColor(s.city), strokeWidth: 1.8 })) ?? [];

  const yearlyByCity = (yearly.data?.series ?? []).map((s) => {
    const y24 = s.points.find((p) => p.year === 2024)?.totalPrecipitation ?? null;
    const y25 = s.points.find((p) => p.year === 2025)?.totalPrecipitation ?? null;
    return {
      city: s.city,
      y2024: y24,
      y2025: y25,
      delta: y24 != null && y25 != null ? y25 - y24 : null,
    };
  });

  const ranking = [...selectedStats].sort((a, b) => (b.totalPrecipitation ?? 0) - (a.totalPrecipitation ?? 0));
  const rankMax = ranking[0]?.totalPrecipitation ?? 1;

  if (summaryError) {
    return (
      <SectionBody>
        <SectionHeader title="Precipitation Analysis" subtitle="Rainfall totals, monthly patterns and inter-city ranking" />
        <ErrorState message={error?.message ?? "Failed to load dataset summary."} onRetry={() => refetch()} />
      </SectionBody>
    );
  }

  return (
    <SectionBody>
      <SectionHeader
        title="Precipitation Analysis"
        subtitle="Total precipitation and rain by city, monthly patterns, inter-year change and ranking"
      />

      {/* KPIs */}
      {summaryLoading || !summary ? (
        <KpiSkeletonGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Droplets}
            label="Combined precipitation"
            value={fmtMm(combinedTotal, false)}
            sub={`${fmtMm(combinedRain, false)} mm of it measured as rain (${avgRainShare.toFixed(1)}%)`}
            accent="violet"
          />
          <KpiCard
            icon={Trophy}
            label="Wettest city"
            value={wettestCity?.city ?? "—"}
            sub={wettestCity ? `${fmtMm(wettestCity.totalPrecipitation)} across 2024–2025` : undefined}
            accent="lav"
          />
          <KpiCard
            icon={CloudRain}
            label="Wettest single day"
            value={extremes.data?.extremes.wettest ? `${fmtMm(extremes.data.extremes.wettest.value, false)} mm` : "—"}
            sub={
              extremes.data?.extremes.wettest
                ? `${extremes.data.extremes.wettest.city} · ${fmtDate(extremes.data.extremes.wettest.date)}`
                : undefined
            }
            accent="aqua"
          />
          <KpiCard
            icon={Umbrella}
            label="Avg rainy days / city"
            value={`${avgRainyDays.toFixed(0)} days`}
            sub="Days with ≥ 1 mm precipitation"
            accent="sand"
          />
        </div>
      )}

      {/* Totals by city */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Total Precipitation by City" subtitle="Cumulative precipitation sum (mm) · 2024–2025">
          {summaryLoading ? (
            <ChartSkeleton height={320} />
          ) : (
            <BarSeriesChart
              data={cityBarData as unknown as Record<string, unknown>[]}
              series={[{ key: "totalPrecipitation", label: "Precipitation (mm)", color: "#8B7CF6", barSize: 30 }]}
              xKey="city"
              height={320}
              unit=" mm"
              cellColorKey="city"
              showLegend={false}
            />
          )}
        </ChartCard>

        <ChartCard title="Total Rain by City" subtitle="Cumulative rain sum (mm) · frozen precipitation excluded">
          {summaryLoading ? (
            <ChartSkeleton height={320} />
          ) : (
            <BarSeriesChart
              data={cityBarData as unknown as Record<string, unknown>[]}
              series={[{ key: "totalRain", label: "Rain (mm)", color: "#8B7CF6", barSize: 30 }]}
              xKey="city"
              height={320}
              unit=" mm"
              cellColorKey="city"
              showLegend={false}
            />
          )}
        </ChartCard>
      </div>

      {/* Monthly trends + yearly comparison */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Monthly Precipitation Trends"
          subtitle={cityFilter === "all" ? "Per-city monthly totals (mm) — toggle series in the legend" : `Monthly totals for ${cityFilter}`}
        >
          {monthly.isLoading ? (
            <ChartSkeleton height={330} />
          ) : monthly.isError ? (
            <ErrorState message={monthly.error?.message ?? "Failed to load monthly data."} onRetry={() => monthly.refetch()} />
          ) : (
            <AreaSeriesChart
              data={trendRows as Record<string, unknown>[]}
              series={trendSeries}
              xKey="label"
              height={330}
              unit=" mm"
            />
          )}
        </ChartCard>

        <ChartCard title="2024 vs 2025 Rainfall" subtitle="Total precipitation per city in each calendar year (mm)">
          {yearly.isLoading ? (
            <ChartSkeleton height={330} />
          ) : yearly.isError ? (
            <ErrorState message={yearly.error?.message ?? "Failed to load yearly data."} onRetry={() => yearly.refetch()} />
          ) : (
            <ComboChart
              data={yearlyByCity as unknown as Record<string, unknown>[]}
              bars={[
                { key: "y2024", label: "2024", color: "#6B6787", barSize: 16 },
                { key: "y2025", label: "2025", color: "#8B7CF6", barSize: 16 },
              ]}
              lines={[]}
              xKey="city"
              height={330}
              unit=" mm"
              valueLabels={{ y2024: "2024", y2025: "2025" }}
            />
          )}
        </ChartCard>
      </div>

      {/* Ranking + deltas */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="City Ranking by Precipitation"
          subtitle="Share of the combined total across the current selection"
        >
          {summaryLoading ? (
            <ChartSkeleton height={250} />
          ) : (
            <ol className="space-y-3.5">
              {ranking.map((c, i) => {
                const share = combinedTotal ? ((c.totalPrecipitation ?? 0) / combinedTotal) * 100 : 0;
                return (
                  <li key={c.city} className="flex items-center gap-3">
                    <span className="tabular w-5 text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                    <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cityColor(c.city) }} aria-hidden />
                      {c.city}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-violet/[0.07]">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.max((c.totalPrecipitation ?? 0) / rankMax * 100, 1.5)}%`,
                          background: `linear-gradient(90deg, ${cityColor(c.city)}CC, ${cityColor(c.city)}66)`,
                        }}
                      />
                    </div>
                    <span className="tabular w-24 shrink-0 text-right text-xs text-muted-foreground">
                      {fmtMm(c.totalPrecipitation, false)} mm · {share.toFixed(1)}%
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </ChartCard>

        <ChartCard title="Inter-Year Change" subtitle="2025 minus 2024 precipitation per city (mm)">
          {yearly.isLoading ? (
            <ChartSkeleton height={250} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {yearlyByCity.map((row) => (
                <div key={row.city} className="rounded-lg border border-border/60 bg-panel-2/50 px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: cityColor(row.city) }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cityColor(row.city) }} aria-hidden />
                    {row.city}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <DeltaChip value={row.delta} unit=" mm" />
                  </div>
                  <div className="tabular mt-1.5 text-[11px] text-muted-foreground">
                    {fmtMm(row.y2024, false)} → {fmtMm(row.y2025, false)} mm
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Wettest days */}
      <div className="mt-4">
        <ChartCard title="Heaviest Rainfall Days" subtitle="The eight wettest daily observations in the current selection">
          {extremes.isLoading ? (
            <ChartSkeleton height={190} />
          ) : extremes.isError ? (
            <ErrorState message={extremes.error?.message ?? "Failed to load extremes."} onRetry={() => extremes.refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {(extremes.data?.wettestDays ?? []).slice(0, 8).map((row, i) => (
                <div key={`${row.city}-${row.date}`} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-panel-2/40 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="tabular w-4 text-[10px] text-muted-foreground/70">{i + 1}</span>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cityColor(row.city) }} aria-hidden />
                    <span className="truncate text-xs text-secondary-foreground">{row.city}</span>
                  </span>
                  <span className="tabular shrink-0 text-[11px] text-muted-foreground">{fmtDate(row.date)}</span>
                  <span className="tabular shrink-0 text-xs font-semibold text-lav">{fmtMm(row.value, false)} mm</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {summary && (
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Combined total computed across {fmtInt(selectedStats.length)} cities. precipitation_sum includes rain plus any
          frozen precipitation; in these five cities rain accounts for {avgRainShare.toFixed(1)}% of all precipitation
          during 2024–2025.
        </p>
      )}
    </SectionBody>
  );
}
