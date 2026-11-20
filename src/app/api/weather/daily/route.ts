import { NextRequest, NextResponse } from "next/server";
import { getDataset } from "@/lib/weather/dataset";
import { cacheHeaders, jsonError, withDataset } from "@/lib/weather/api";
import { CITY_NAMES } from "@/lib/weather/types";
import type { DailyResponse } from "@/lib/weather/api-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const city = request.nextUrl.searchParams.get("city") ?? CITY_NAMES[0];
      const resolved = CITY_NAMES.includes(city) ? city : CITY_NAMES[0];

      const records = dataset.records.filter((r) => r.city === resolved);
      const response: DailyResponse = {
        city: resolved,
        points: records.map((r) => ({
          date: r.date,
          temperatureMax: r.temperatureMax,
          temperatureMin: r.temperatureMin,
          temperatureMean: r.temperatureMean,
          precipitation: r.precipitation,
          windSpeedMax: r.windSpeedMax,
          windGustsMax: r.windGustsMax,
        })),
      };
      return NextResponse.json(response, { headers: cacheHeaders });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
