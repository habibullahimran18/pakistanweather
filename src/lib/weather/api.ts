/** Shared helpers for the /api/weather route handlers. */

import { NextResponse } from "next/server";
import { getDataset, DatasetUnavailableError } from "./dataset";
import { ALL_CITIES_LABEL } from "./aggregate";
import { CITY_NAMES } from "./types";

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function withDataset<T>(handler: () => T): T | NextResponse {
  try {
    return handler();
  } catch (error) {
    if (error instanceof DatasetUnavailableError) {
      return jsonError(error.message, 503) as T;
    }
    console.error("[api/weather]", error);
    return jsonError("Failed to compute weather analytics.") as T;
  }
}

/**
 * Parse a `cities` query parameter: "all" (default) or a comma-separated
 * list of known city names. Unknown names are ignored. Returns the resolved
 * list plus whether the special "All Cities (avg)" aggregate series should
 * be included.
 */
export function parseCitiesParam(citiesParam: string | null): {
  cities: string[];
  includeAll: boolean;
} {
  const valid = CITY_NAMES.filter((c) => (citiesParam ?? "all").split(",").map((s) => s.trim()).includes(c));
  const param = (citiesParam ?? "all").trim().toLowerCase();
  const includeAll = param === "all" || valid.length === 0 || valid.length === CITY_NAMES.length;
  return {
    cities: valid.length ? valid : CITY_NAMES,
    includeAll,
  };
}

export const cacheHeaders = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export { ALL_CITIES_LABEL };
