import { NextRequest, NextResponse } from "next/server";
import { buildQualityReport } from "@/lib/weather/aggregate";
import { getDataset } from "@/lib/weather/dataset";
import { cacheHeaders, jsonError, withDataset } from "@/lib/weather/api";
import type { QualityReport } from "@/lib/weather/api-types";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const report: QualityReport = buildQualityReport(
        dataset.records,
        dataset.duplicatesRemoved,
        dataset.start,
        dataset.end
      );
      return NextResponse.json(report, { headers: cacheHeaders });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
