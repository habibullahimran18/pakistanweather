import { NextRequest, NextResponse } from "next/server";
import { buildMonthlyHeatmap, buildSeasonalSeries } from "@/lib/weather/aggregate";
import { getDataset } from "@/lib/weather/dataset";
import { cacheHeaders, jsonError, parseCitiesParam, withDataset } from "@/lib/weather/api";
import { SEASONS } from "@/lib/weather/types";
import type { SeasonalResponse } from "@/lib/weather/api-types";

export const runtime = "nodejs";

const METRICS = ["temperatureMean", "temperatureMax", "temperatureMin", "precipitation"] as const;

export async function GET(request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const { cities } = parseCitiesParam(request.nextUrl.searchParams.get("cities"));
      const metricParam = request.nextUrl.searchParams.get("heatmapMetric");
      const metric = METRICS.includes((metricParam ?? "") as (typeof METRICS)[number])
        ? (metricParam as (typeof METRICS)[number])
        : "temperatureMean";

      const series = buildSeasonalSeries(dataset.records, cities);
      const heatmap = buildMonthlyHeatmap(dataset.records, cities, metric);

      const response: SeasonalResponse = {
        seasons: SEASONS.map((s) => ({ name: s.name, window: s.window })),
        series,
        heatmap,
        heatmapMetric: metric,
      };
      return NextResponse.json(response, { headers: cacheHeaders });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
