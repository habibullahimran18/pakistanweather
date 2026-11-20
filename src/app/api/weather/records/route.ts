import { NextRequest, NextResponse } from "next/server";
import { getDataset } from "@/lib/weather/dataset";
import { jsonError, withDataset } from "@/lib/weather/api";
import { queryRecords, recordsToCsv } from "@/lib/weather/aggregate";
import type { RecordsResponse } from "@/lib/weather/api-types";

export const runtime = "nodejs";

function queryFromRequest(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  return {
    search: sp.get("search") ?? undefined,
    city: sp.get("city") ?? undefined,
    year: sp.get("year") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    dir: sp.get("dir") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  return withDataset(() => {
    try {
      const dataset = getDataset();
      const sp = request.nextUrl.searchParams;
      const query = queryFromRequest(request);

      // CSV export shares the exact same filter contract
      if (sp.get("format") === "csv") {
        const all = queryRecords(
          dataset.records,
          {
            search: query.search,
            city: query.city,
            year: query.year,
            from: query.from,
            to: query.to,
            sort: query.sort,
            dir: query.dir,
            page: "1",
            pageSize: String(dataset.records.length),
          },
          { maxPageSize: dataset.records.length }
        );
        const csv = recordsToCsv(all.rows);
        return new NextResponse(csv, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="pakistan-weatherwatch-records-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        });
      }

      const result = queryRecords(dataset.records, query);

      const response: RecordsResponse = {
        rows: result.rows.map((r) => ({
          city: r.city,
          date: r.date,
          year: r.year,
          month: r.month,
          monthName: r.monthName,
          day: r.day,
          temperatureMax: r.temperatureMax,
          temperatureMin: r.temperatureMin,
          temperatureMean: r.temperatureMean,
          precipitation: r.precipitation,
          rain: r.rain,
          windSpeedMax: r.windSpeedMax,
          windGustsMax: r.windGustsMax,
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        sort: result.sort,
        dir: result.dir,
      };
      return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
    }
  });
}
