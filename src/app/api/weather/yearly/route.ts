import { NextRequest, NextResponse } from "next/server";
import { buildYearlySeries } from "@/lib/weather/aggregate";
import { getDataset } from "@/lib/weather/dataset";
import { cacheHeaders, jsonError, parseCitiesParam, withDataset } from "@/lib/weather/api";
import type { YearlyResponse } from "@/lib/weather/api-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const { cities } = parseCitiesParam(request.nextUrl.searchParams.get("cities"));
      const result = buildYearlySeries(dataset.records, cities);

      const response: YearlyResponse = {
        years: result.years,
        series: result.series,
      };
      return NextResponse.json(response, { headers: cacheHeaders });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
