"use client";

/**
 * SEASONAL ANALYSIS — meteorological seasons (Winter DJF, Spring MAM,
 * Summer JJA, Autumn SON), seasonal city comparison and monthly heatmap.
 */

import { useState } from "react";
import { Flower2, Leaf, Snowflake, Sun } from "lucide-react";
import { BarSeriesChart, ChartCard, RadarSeriesChart, scaleColor } from "@/components/charts/chart-kit";
import {
  ChartSkeleton,
  ErrorState,
  SectionBody,
  SectionHeader,
  StatTile,
} from "@/components/dashboard/ui-bits";
import { useDashboard } from "@/lib/store";
import { useSeasonal } from "@/hooks/use-weather";
import { cityColor, fmtMm, fmtTemp } from "@/lib/weather/format";
import { CITY_NAMES, SEASONS, type SeasonName } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

type HeatmapMetric = "temperatureMean" | "temperatureMax" | "temperatureMin" | "precipitation";

const SEASON_ICONS: Record<SeasonName, React.ComponentType<{ className?: string }>> = {
  Winter: Snowflake,
  Spring: Flower2,
  Summer: Sun,
  Autumn: Leaf,
};

export default function SectionSeasonal() {
  const cityFilter = useDashboard((s) => s.cityFilter);
  const citiesParam = cityFilter === "all" ? CITY_NAMES.join(",") : cityFilter;

  const [selectedSeason, setSelectedSeason] = useState<SeasonName | "All">("All");
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("temperatureMean");

  const { data, isLoading, isError, error, refetch } = useSeasonal(citiesParam);

  const cities = data?.series.map((s) => s.city) ?? [];
  const seasonPointFor = (city: string) => data?.series.find((s) => s.city === city)?.points ?? [];

  // grouped rows: one row per season, one column per city
  const seasonalRows = SEASONS.map((season) => {
    const row: Record<string, unknown> = { season: season.name, window: season.window };
    for (const city of cities) {
      const point = seasonPointFor(city).find((p) => p.season === season.name);
      if (point) {
        row[`${city}__temp`] = point.avgTempMean;
        row[`${city}__precip`] = point.totalPrecipitation;
        row[`${city}__wind`] = point.avgWindSpeed;
        row[`${city}__tmax`] = point.avgTempMax;
        row[`${city}__tmin`] = point.avgTempMin;
      }
    }
    return row;
  });

  const citySeries = cities.map((city) => ({
    key: `${city}__temp`,
    label: city,
    color: cityColor(city),
    barSize: 12,
  }));
  const precipSeries = cities.map((city) => ({
    key: `${city}__precip`,
    label: city,
    color: cityColor(city),
    barSize: 12,
  }));
  const windSeries = cities.map((city) => ({
    key: `${city}__wind`,
    label: city,
    color: cityColor(city),
    barSize: 12,
  }));

  const rowsForView = selectedSeason === "All" ? seasonalRows : seasonalRows.filter((r) => r.season === selectedSeason);

  // radar: seasons as axes — selected cities as series (temp)
  const radarData = SEASONS.map((season) => {
    const row: Record<string, unknown> = { season: season.name };
    for (const city of cities) {
      const point = seasonPointFor(city).find((p) => p.season === season.name);
      if (point) row[city] = point.avgTempMean;
    }
    return row;
  });

  // season summary (5-city averages)
  const seasonSummary = SEASONS.map((season) => {
    const points = data?.series.map((s) => s.points.find((p) => p.season === season.name)).filter(Boolean) ?? [];
    const avg = (key: "avgTempMean" | "totalPrecipitation" | "avgWindSpeed" | "avgTempMax" | "avgTempMin") => {
      const values = points.map((p) => p?.[key]).filter((v): v is number => v != null);
      return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
    };
    return {
      season: season.name,
      window: season.window,
      avgTempMean: avg("avgTempMean"),
      avgTempMax: avg("avgTempMax"),
      avgTempMin: avg("avgTempMin"),
      totalPrecipitation: avg("totalPrecipitation"),
      avgWindSpeed: avg("avgWindSpeed"),
    };
  });

  return (
    <SectionBody>
      <SectionHeader
        title="Seasonal Analysis"
        subtitle="Meteorological seasons — Winter (Dec–Feb), Spring (Mar–May), Summer (Jun–Aug), Autumn (Sep–Nov)"
        actions={
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Season filter">
            {(["All", ...SEASONS.map((s) => s.name)] as (SeasonName | "All")[]).map((season) => {
              const Icon = season === "All" ? Sun : SEASON_ICONS[season];
              const active = selectedSeason === season;
              return (
                <button
                  key={season}
                  type="button"
                  onClick={() => setSelectedSeason(season)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "border-violet/40 bg-violet/15 text-lav"
                      : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {season}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Season summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SEASONS.map((s) => (
            <div key={s.name} className="h-[120px] rounded-xl border border-border/80 bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {seasonSummary.map((s) => {
            const Icon = SEASON_ICONS[s.season];
            const highlighted = selectedSeason === s.season;
            return (
              <button
                key={s.season}
                type="button"
                onClick={() => setSelectedSeason(highlighted ? "All" : (s.season as SeasonName))}
                aria-pressed={highlighted}
                className={cn(
                  "rounded-xl border bg-card p-5 text-left shadow-[0_1px_2px_rgba(43,35,80,0.08)] transition-all duration-200 hover:-translate-y-0.5",
                  highlighted ? "border-violet/40 ring-1 ring-violet/25" : "border-border/80 hover:border-violet/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet/20 bg-violet/10">
                      <Icon className="h-4 w-4 text-lav" aria-hidden />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{s.season}</div>
                      <div className="text-[11px] text-muted-foreground">{s.window}</div>
                    </div>
                  </div>
                  <span className="tabular rounded-md bg-panel-2/60 px-2 py-1 text-xs font-semibold text-foreground">
                    {fmtTemp(s.avgTempMean, false)}°
                  </span>
                </div>
                <div className="mt-3.5 grid grid-cols-3 gap-2">
                  <StatTile label="Avg min" value={fmtTemp(s.avgTempMin, false)} unit="°C" />
                  <StatTile label="Avg max" value={fmtTemp(s.avgTempMax, false)} unit="°C" />
                  <StatTile label="Avg rain" value={fmtMm(s.totalPrecipitation, false)} unit="mm" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Seasonal comparisons */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Seasonal Average Temperature"
          subtitle={
            selectedSeason === "All"
              ? "Average daily mean temperature per city per season (°C)"
              : `Average daily mean per city in ${selectedSeason} (°C)`
          }
        >
          {isLoading ? (
            <ChartSkeleton height={330} />
          ) : isError ? (
            <ErrorState message={error?.message ?? "Failed to load seasonal data."} onRetry={() => refetch()} />
          ) : (
            <BarSeriesChart
              data={rowsForView as unknown as Record<string, unknown>[]}
              series={citySeries}
              xKey="season"
              height={330}
              unit="°C"
            />
          )}
        </ChartCard>

        <ChartCard
          title="Seasonal Precipitation"
          subtitle={
            selectedSeason === "All"
              ? "Total precipitation per city per season (mm)"
              : `Total precipitation per city in ${selectedSeason} (mm)`
          }
        >
          {isLoading ? (
            <ChartSkeleton height={330} />
          ) : isError ? (
            <ErrorState message={error?.message ?? "Failed to load seasonal data."} onRetry={() => refetch()} />
          ) : (
            <BarSeriesChart
              data={rowsForView as unknown as Record<string, unknown>[]}
              series={precipSeries}
              xKey="season"
              height={330}
              unit=" mm"
            />
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Seasonal Wind Comparison" subtitle="Average daily max wind speed per city per season (km/h)">
          {isLoading ? (
            <ChartSkeleton height={330} />
          ) : isError ? (
            <ErrorState message={error?.message ?? "Failed to load seasonal data."} onRetry={() => refetch()} />
          ) : (
            <BarSeriesChart
              data={rowsForView as unknown as Record<string, unknown>[]}
              series={windSeries}
              xKey="season"
              height={330}
              unit=" km/h"
            />
          )}
        </ChartCard>

        <ChartCard
          title="Seasonal Temperature Profile"
          subtitle="Radar of average seasonal temperature per city (°C) — toggle legend to focus"
        >
          {isLoading ? (
            <ChartSkeleton height={330} />
          ) : isError ? (
            <ErrorState message={error?.message ?? "Failed to load seasonal data."} onRetry={() => refetch()} />
          ) : (
            <RadarSeriesChart
              data={radarData as unknown as Record<string, unknown>[]}
              series={cities.map((city) => ({ key: city, label: city, color: cityColor(city) }))}
              xKey="season"
              height={330}
              unit="°C"
            />
          )}
        </ChartCard>
      </div>

      {/* Heatmap */}
      <div className="mt-4">
        <ChartCard
          title="Monthly Temperature Heatmap"
          subtitle="Average temperature per calendar month (aggregated across 2024 and 2025) for each city"
          actions={
            <select
              aria-label="Heatmap metric"
              value={heatmapMetric}
              onChange={(e) => setHeatmapMetric(e.target.value as HeatmapMetric)}
              className="h-8 rounded-md border border-border/80 bg-panel-2/70 px-2 text-xs text-secondary-foreground outline-none focus:ring-1 focus:ring-violet/50"
            >
              <option value="temperatureMean">Mean temp</option>
              <option value="temperatureMax">Max temp</option>
              <option value="temperatureMin">Min temp</option>
              <option value="precipitation">Precipitation</option>
            </select>
          }
        >
          {isLoading ? (
            <ChartSkeleton height={280} />
          ) : isError ? (
            <ErrorState message={error?.message ?? "Failed to load heatmap."} onRetry={() => refetch()} />
          ) : (
            <HeatmapGrid
              cities={data?.heatmap.cities ?? []}
              months={data?.heatmap.months ?? []}
              values={data?.heatmap.values ?? []}
              min={data?.heatmap.min ?? 0}
              max={data?.heatmap.max ?? 1}
              metric={heatmapMetric}
            />
          )}
        </ChartCard>
      </div>
    </SectionBody>
  );
}

function HeatmapGrid({
  cities,
  months,
  values,
  min,
  max,
  metric,
}: {
  cities: string[];
  months: string[];
  values: (number | null)[][];
  min: number;
  max: number;
  metric: HeatmapMetric;
}) {
  const [hover, setHover] = useState<{ city: string; month: string; value: number | null } | null>(null);
  const unit = metric === "precipitation" ? " mm" : "°C";

  return (
    <div className="flex flex-col gap-3">
      <div className="ww-scroll overflow-x-auto pb-1">
        <div className="min-w-[760px]">
          {/* month header */}
          <div className="flex items-center gap-1">
            <div className="w-[92px] shrink-0" />
            <div className="grid flex-1 grid-cols-12 gap-1">
              {months.map((m) => (
                <div key={m} className="text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {m}
                </div>
              ))}
            </div>
          </div>
          {/* rows */}
          <div className="mt-1.5 space-y-1">
            {cities.map((city, ci) => (
              <div key={city} className="flex items-center gap-1">
                <div className="flex w-[92px] shrink-0 items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cityColor(city) }} aria-hidden />
                  <span className="truncate text-xs text-secondary-foreground">{city}</span>
                </div>
                <div className="grid flex-1 grid-cols-12 gap-1">
                  {months.map((month, mi) => {
                    const value = values[ci]?.[mi] ?? null;
                    const bg = value !== null ? scaleColor(value, min, max) : "rgba(43,35,80,0.05)";
                    return (
                      <div
                        key={`${city}-${month}`}
                        role="img"
                        aria-label={`${city} ${month}: ${value !== null ? `${value.toFixed(1)}${unit}` : "no data"}`}
                        onMouseEnter={() => setHover({ city, month, value })}
                        onMouseLeave={() => setHover(null)}
                        className="group relative flex h-10 cursor-default items-center justify-center rounded-md text-[10px] font-semibold tabular transition-transform duration-100 hover:scale-[1.06] hover:ring-1 hover:ring-ink/25"
                        style={{
                          backgroundColor: bg,
                          color: value !== null ? "rgba(43,35,80,0.9)" : "transparent",
                        }}
                      >
                        {value !== null ? value.toFixed(1) : ""}
                        <span className="sr-only">{`${city} ${month}: ${value !== null ? value.toFixed(1) + unit : "no data"}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* legend + hover readout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{metric === "precipitation" ? "Low" : "Cool"}</span>
          <div
            className="h-2.5 w-40 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${scaleColor(min, min, max)}, ${scaleColor((min + max) / 2, min, max)}, ${scaleColor(max, min, max)})`,
            }}
            aria-hidden
          />
          <span>{metric === "precipitation" ? "High" : "Hot"}</span>
          <span className="tabular ml-1">
            {min.toFixed(1)}
            {unit} → {max.toFixed(1)}
            {unit}
          </span>
        </div>
        <div className="tabular text-[11px] text-muted-foreground" aria-live="polite">
          {hover
            ? `${hover.city} · ${hover.month} · ${hover.value !== null ? `${hover.value.toFixed(1)}${unit}` : "no data"}`
            : "Hover a cell for details"}
        </div>
      </div>
    </div>
  );
}
