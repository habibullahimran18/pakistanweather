import { NextRequest, NextResponse } from "next/server";
import { buildCityStats, buildExtremes } from "@/lib/weather/aggregate";
import { getDataset } from "@/lib/weather/dataset";
import { cacheHeaders, jsonError, withDataset } from "@/lib/weather/api";
import { WEATHER_PARAMETERS } from "@/lib/weather/types";
import type { SummaryResponse } from "@/lib/weather/api-types";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const cityStats = buildCityStats(dataset.records);
      const extremes = buildExtremes(dataset.records);
      const missingTotal = Object.values(dataset.missingByColumn).reduce((s, v) => s + v, 0);
      const numericCells = dataset.records.length * WEATHER_PARAMETERS.length;
      const completenessPct = numericCells
        ? Math.round(((numericCells - missingTotal) / numericCells) * 1000) / 10
        : 0;

      const orderedCities = Object.values(cityStats).sort(
        (a, b) => (b.avgTempMean ?? -999) - (a.avgTempMean ?? -999)
      );

      const response: SummaryResponse = {
        kpis: {
          totalRecords: dataset.records.length,
          cityCount: dataset.cities.length,
          parameterCount: WEATHER_PARAMETERS.length,
          start: dataset.start,
          end: dataset.end,
          daysPerCity: Object.values(cityStats)[0]?.records ?? 0,
          missingTotal,
          completenessPct,
        },
        cities: orderedCities,
        extremes,
        meta: {
          source: "Open-Meteo Historical Weather API (archive-api.open-meteo.com)",
          timezone: "Asia/Karachi",
          generatedBy: "Pakistan WeatherWatch ETL pipeline (Python: extract → transform → load)",
        },
      };

      return NextResponse.json(response, { headers: cacheHeaders });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
