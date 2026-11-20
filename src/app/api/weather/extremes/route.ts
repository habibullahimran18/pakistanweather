import { NextRequest, NextResponse } from "next/server";
import { buildExtremes, topDays } from "@/lib/weather/aggregate";
import { getDataset } from "@/lib/weather/dataset";
import { cacheHeaders, jsonError, parseCitiesParam, withDataset } from "@/lib/weather/api";

export const runtime = "nodejs";

export interface ExtremesResponse {
  extremes: ReturnType<typeof buildExtremes>;
  hottestDays: { city: string; date: string; value: number }[];
  coldestDays: { city: string; date: string; value: number }[];
  wettestDays: { city: string; date: string; value: number }[];
  windiestDays: { city: string; date: string; value: number }[];
}

export async function GET(request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const { cities } = parseCitiesParam(request.nextUrl.searchParams.get("cities"));
      const filtered = dataset.records.filter((r) => cities.includes(r.city));

      const response: ExtremesResponse = {
        extremes: buildExtremes(filtered),
        hottestDays: topDays(filtered, "temperatureMax", "max", 8),
        coldestDays: topDays(filtered, "temperatureMin", "min", 8),
        wettestDays: topDays(filtered, "precipitation", "max", 8),
        windiestDays: topDays(filtered, "windGustsMax", "max", 8),
      };
      return NextResponse.json(response, { headers: cacheHeaders });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
