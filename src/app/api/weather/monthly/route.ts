import { NextRequest, NextResponse } from "next/server";
import { buildMonthlySeries } from "@/lib/weather/aggregate";
import { getDataset } from "@/lib/weather/dataset";
import { cacheHeaders, jsonError, parseCitiesParam, withDataset } from "@/lib/weather/api";
import type { MonthlyResponse } from "@/lib/weather/api-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const { cities, includeAll } = parseCitiesParam(request.nextUrl.searchParams.get("cities"));
      const result = buildMonthlySeries(dataset.records, cities, includeAll);

      const response: MonthlyResponse = {
        months: result.months,
        series: result.series,
      };
      return NextResponse.json(response, { headers: cacheHeaders });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
