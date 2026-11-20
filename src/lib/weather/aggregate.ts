/**
 * Aggregation engine — all analytics are computed from the parsed dataset.
 * Missing measurements are skipped in aggregates, never treated as zero.
 */

import { SEASONS, seasonOfMonth, type SeasonName, type WeatherRecord } from "./types";

// ---------- numeric helpers ----------

export function mean(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

export function sum(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0);
}

export function round(value: number | null, decimals = 1): number | null {
  if (value === null) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const pick = <K extends keyof WeatherRecord>(records: WeatherRecord[], key: K) =>
  records.map((r) => r[key]);

function extreme(
  records: WeatherRecord[],
  key: "temperatureMax" | "temperatureMin" | "precipitation" | "windSpeedMax" | "windGustsMax" | "temperatureMean",
  mode: "max" | "min"
): { date: string; city: string; value: number } | null {
  let best: WeatherRecord | null = null;
  let bestValue: number | null = null;
  for (const r of records) {
    const v = r[key];
    if (v === null || !Number.isFinite(v)) continue;
    if (bestValue === null || (mode === "max" ? v > bestValue : v < bestValue)) {
      bestValue = v;
      best = r;
    }
  }
  if (!best || bestValue === null) return null;
  return { date: best.date, city: best.city, value: bestValue };
}

export function daysBetweenInclusive(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

// ---------- grouped aggregates ----------

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const arr = map.get(key);
    if (arr) arr.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export interface GroupedStats {
  days: number;
  avgTempMax: number | null;
  avgTempMin: number | null;
  avgTempMean: number | null;
  totalPrecipitation: number | null;
  totalRain: number | null;
  avgWindSpeed: number | null;
  avgWindGusts: number | null;
  maxWindGust: number | null;
  rainyDays: number;
}

export function groupedStats(records: WeatherRecord[]): GroupedStats {
  const precipSum = sum(pick(records, "precipitation"));
  const rainSum = sum(pick(records, "rain"));
  return {
    days: records.length,
    avgTempMax: mean(pick(records, "temperatureMax")),
    avgTempMin: mean(pick(records, "temperatureMin")),
    avgTempMean: mean(pick(records, "temperatureMean")),
    totalPrecipitation: precipSum,
    totalRain: rainSum,
    avgWindSpeed: mean(pick(records, "windSpeedMax")),
    avgWindGusts: mean(pick(records, "windGustsMax")),
    maxWindGust: extreme(records, "windGustsMax", "max")?.value ?? null,
    rainyDays: records.filter((r) => (r.precipitation ?? 0) >= 1).length,
  };
}

// ---------- per-city stats ----------

export interface DayExtreme {
  date: string;
  value: number;
}

export interface CityStat {
  city: string;
  records: number;
  start: string;
  end: string;
  avgTempMax: number | null;
  avgTempMin: number | null;
  avgTempMean: number | null;
  absMaxTemp: number | null;
  absMaxTempDate: string | null;
  absMinTemp: number | null;
  absMinTempDate: string | null;
  totalPrecipitation: number | null;
  totalRain: number | null;
  maxDailyPrecipitation: number | null;
  maxDailyPrecipDate: string | null;
  rainyDays: number;
  avgWindSpeed: number | null;
  avgWindGusts: number | null;
  maxWindSpeed: number | null;
  maxWindSpeedDate: string | null;
  maxWindGust: number | null;
  maxWindGustDate: string | null;
  avgGustRatio: number | null;
}

export function buildCityStat(city: string, records: WeatherRecord[]): CityStat {
  const dates = records.map((r) => r.date).sort();
  const gustRatios = records
    .map((r) =>
      r.windGustsMax !== null && r.windSpeedMax !== null && r.windSpeedMax > 0
        ? r.windGustsMax / r.windSpeedMax
        : null
    )
    .filter((v): v is number => v !== null);

  const hottest = extreme(records, "temperatureMax", "max");
  const coldest = extreme(records, "temperatureMin", "min");
  const wettest = extreme(records, "precipitation", "max");
  const windiest = extreme(records, "windSpeedMax", "max");
  const gustiest = extreme(records, "windGustsMax", "max");

  return {
    city,
    records: records.length,
    start: dates[0] ?? "",
    end: dates[dates.length - 1] ?? "",
    avgTempMax: round(mean(pick(records, "temperatureMax")), 1),
    avgTempMin: round(mean(pick(records, "temperatureMin")), 1),
    avgTempMean: round(mean(pick(records, "temperatureMean")), 1),
    absMaxTemp: hottest?.value ?? null,
    absMaxTempDate: hottest?.date ?? null,
    absMinTemp: coldest?.value ?? null,
    absMinTempDate: coldest?.date ?? null,
    totalPrecipitation: round(sum(pick(records, "precipitation")), 1),
    totalRain: round(sum(pick(records, "rain")), 1),
    maxDailyPrecipitation: wettest?.value ?? null,
    maxDailyPrecipDate: wettest?.date ?? null,
    rainyDays: records.filter((r) => (r.precipitation ?? 0) >= 1).length,
    avgWindSpeed: round(mean(pick(records, "windSpeedMax")), 1),
    avgWindGusts: round(mean(pick(records, "windGustsMax")), 1),
    maxWindSpeed: windiest?.value ?? null,
    maxWindSpeedDate: windiest?.date ?? null,
    maxWindGust: gustiest?.value ?? null,
    maxWindGustDate: gustiest?.date ?? null,
    avgGustRatio: round(mean(gustRatios), 2),
  };
}

export function buildCityStats(records: WeatherRecord[]): Record<string, CityStat> {
  const byCity = groupBy(records, (r) => r.city);
  const out: Record<string, CityStat> = {};
  for (const [city, cityRecords] of byCity) {
    out[city] = buildCityStat(city, cityRecords);
  }
  return out;
}

// ---------- monthly series ----------

export interface MonthlyPoint {
  month: string; // "2024-01"
  label: string; // "Jan ’24"
  monthName: string;
  monthNum: number;
  year: number;
  days: number;
  avgTempMax: number | null;
  avgTempMin: number | null;
  avgTempMean: number | null;
  totalPrecipitation: number | null;
  totalRain: number | null;
  avgWindSpeed: number | null;
  avgWindGusts: number | null;
  maxWindGust: number | null;
  rainyDays: number;
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map((v) => parseInt(v, 10));
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[month - 1]} ’${String(year).slice(2)}`;
}

function monthlyPoint(monthKey: string, records: WeatherRecord[]): MonthlyPoint {
  const [year, monthNum] = monthKey.split("-").map((v) => parseInt(v, 10));
  const stats = groupedStats(records);
  const names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return {
    month: monthKey,
    label: monthLabel(monthKey),
    monthName: names[monthNum - 1],
    monthNum,
    year,
    days: records.length,
    avgTempMax: round(stats.avgTempMax, 1),
    avgTempMin: round(stats.avgTempMin, 1),
    avgTempMean: round(stats.avgTempMean, 1),
    totalPrecipitation: round(stats.totalPrecipitation, 1),
    totalRain: round(stats.totalRain, 1),
    avgWindSpeed: round(stats.avgWindSpeed, 1),
    avgWindGusts: round(stats.avgWindGusts, 1),
    maxWindGust: round(stats.maxWindGust, 1),
    rainyDays: stats.rainyDays,
  };
}

export interface MonthlySeries {
  months: string[];
  series: { city: string; points: MonthlyPoint[] }[];
}

/**
 * Build monthly series per city. If `allAggregate` is true, also includes an
 * "All Cities (avg)" series where each metric is the unweighted mean across
 * the cities present in that month (precipitation included).
 */
export function buildMonthlySeries(
  records: WeatherRecord[],
  cities: string[],
  allAggregate: boolean
): MonthlySeries {
  const byCity = groupBy(
    records.filter((r) => cities.includes(r.city)),
    (r) => r.city
  );

  const monthsSet = new Set<string>();
  for (const cityRecords of byCity.values()) {
    for (const r of cityRecords) monthsSet.add(`${r.year}-${String(r.month).padStart(2, "0")}`);
  }
  const months = [...monthsSet].sort();

  const series: MonthlySeries["series"] = [];

  for (const [city, cityRecords] of byCity) {
    const byMonth = groupBy(cityRecords, (r) => `${r.year}-${String(r.month).padStart(2, "0")}`);
    series.push({
      city,
      points: months.map((m) => monthlyPoint(m, byMonth.get(m) ?? [])),
    });
  }

  if (allAggregate && cities.length > 1) {
    const citySeries = series.filter((s) => s.city !== ALL_CITIES_LABEL);
    const points = months.map((m) => {
      const relevant = citySeries.map((s) => s.points.find((p) => p.month === m)).filter((p): p is MonthlyPoint => Boolean(p));
      if (relevant.length === 0) {
        return monthlyPoint(m, []);
      }
      const avg = (key: keyof MonthlyPoint) => {
        const values = relevant.map((p) => p[key]).filter((v): v is number => v !== null);
        return values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null;
      };
      return {
        month: m,
        label: monthLabel(m),
        monthName: relevant[0]?.monthName ?? "",
        monthNum: relevant[0]?.monthNum ?? 0,
        year: relevant[0]?.year ?? 0,
        days: relevant.reduce((s, p) => s + p.days, 0),
        avgTempMax: avg("avgTempMax"),
        avgTempMin: avg("avgTempMin"),
        avgTempMean: avg("avgTempMean"),
        totalPrecipitation: avg("totalPrecipitation"),
        totalRain: avg("totalRain"),
        avgWindSpeed: avg("avgWindSpeed"),
        avgWindGusts: avg("avgWindGusts"),
        maxWindGust: avg("maxWindGust"),
        rainyDays: avg("rainyDays") ?? 0,
      } satisfies MonthlyPoint;
    });
    series.unshift({ city: ALL_CITIES_LABEL, points });
  }

  return { months, series };
}

export const ALL_CITIES_LABEL = "All Cities (avg)";

// ---------- yearly aggregates ----------

export interface YearlyPoint {
  year: number;
  days: number;
  avgTempMax: number | null;
  avgTempMin: number | null;
  avgTempMean: number | null;
  totalPrecipitation: number | null;
  totalRain: number | null;
  avgWindSpeed: number | null;
  avgWindGusts: number | null;
  rainyDays: number;
}

export function buildYearlySeries(records: WeatherRecord[], cities: string[]) {
  const filtered = records.filter((r) => cities.includes(r.city));
  const byCityYear = groupBy(filtered, (r) => `${r.city}|${r.year}`);
  const years = [...new Set(filtered.map((r) => r.year))].sort();

  const series = [...new Set(filtered.map((r) => r.city))].map((city) => ({
    city,
    points: years.map((year) => {
      const stats = groupedStats(byCityYear.get(`${city}|${year}`) ?? []);
      return {
        year,
        days: stats.days,
        avgTempMax: round(stats.avgTempMax, 1),
        avgTempMin: round(stats.avgTempMin, 1),
        avgTempMean: round(stats.avgTempMean, 1),
        totalPrecipitation: round(stats.totalPrecipitation, 1),
        totalRain: round(stats.totalRain, 1),
        avgWindSpeed: round(stats.avgWindSpeed, 1),
        avgWindGusts: round(stats.avgWindGusts, 1),
        rainyDays: stats.rainyDays,
      } satisfies YearlyPoint;
    }),
  }));

  return { years, series };
}

// ---------- seasonal aggregates ----------

export interface SeasonPoint {
  season: SeasonName;
  window: string;
  days: number;
  avgTempMax: number | null;
  avgTempMin: number | null;
  avgTempMean: number | null;
  totalPrecipitation: number | null;
  totalRain: number | null;
  avgWindSpeed: number | null;
  rainyDays: number;
}

export function buildSeasonalSeries(records: WeatherRecord[], cities: string[]) {
  const filtered = records.filter((r) => cities.includes(r.city));
  const byCitySeason = new Map<string, WeatherRecord[]>();
  for (const r of filtered) {
    const key = `${r.city}|${seasonOfMonth(r.month)}`;
    const arr = byCitySeason.get(key);
    if (arr) arr.push(r);
    else byCitySeason.set(key, [r]);
  }

  const series = [...new Set(filtered.map((r) => r.city))].map((city) => ({
    city,
    points: SEASONS.map((season) => {
      const stats = groupedStats(byCitySeason.get(`${city}|${season.name}`) ?? []);
      return {
        season: season.name,
        window: season.window,
        days: stats.days,
        avgTempMax: round(stats.avgTempMax, 1),
        avgTempMin: round(stats.avgTempMin, 1),
        avgTempMean: round(stats.avgTempMean, 1),
        totalPrecipitation: round(stats.totalPrecipitation, 1),
        totalRain: round(stats.totalRain, 1),
        avgWindSpeed: round(stats.avgWindSpeed, 1),
        rainyDays: stats.rainyDays,
      } satisfies SeasonPoint;
    }),
  }));

  return series;
}

// ---------- monthly heatmap (avg temperature per month per city) ----------

export interface HeatmapResult {
  cities: string[];
  months: string[]; // short month names Jan..Dec
  values: (number | null)[][]; // [cityIndex][monthIndex]
  min: number | null;
  max: number | null;
}

export function buildMonthlyHeatmap(
  records: WeatherRecord[],
  cities: string[],
  metric: "temperatureMean" | "temperatureMax" | "temperatureMin" | "precipitation" = "temperatureMean"
): HeatmapResult {
  const filtered = records.filter((r) => cities.includes(r.city));
  const byCityMonth = new Map<string, number[]>();
  for (const r of filtered) {
    const v = r[metric];
    if (v === null) continue;
    const key = `${r.city}|${r.month}`;
    const arr = byCityMonth.get(key);
    if (arr) arr.push(v);
    else byCityMonth.set(key, [v]);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const values = cities.map((city) =>
    monthNames.map((_, idx) => {
      const cellValues = byCityMonth.get(`${city}|${idx + 1}`);
      const m = mean(cellValues ?? []);
      return m === null ? null : round(m, 1);
    })
  );

  const flat = values.flat().filter((v): v is number => v !== null);
  return {
    cities,
    months: monthNames,
    values,
    min: flat.length ? Math.min(...flat) : null,
    max: flat.length ? Math.max(...flat) : null,
  };
}

// ---------- extremes ----------

export interface ExtremeEvent {
  city: string;
  date: string;
  value: number;
}

export function buildExtremes(records: WeatherRecord[]) {
  return {
    hottest: extreme(records, "temperatureMax", "max"),
    coldest: extreme(records, "temperatureMin", "min"),
    wettest: extreme(records, "precipitation", "max"),
    windiestGust: extreme(records, "windGustsMax", "max"),
  };
}

/** Top-N daily records by metric across cities. */
export function topDays(
  records: WeatherRecord[],
  key: "temperatureMax" | "temperatureMin" | "precipitation" | "windGustsMax" | "windSpeedMax",
  mode: "max" | "min",
  n: number
): ExtremeEvent[] {
  const rows = records
    .map((r) => ({ city: r.city, date: r.date, value: r[key] }))
    .filter((r): r is { city: string; date: string; value: number } => r.value !== null)
    .sort((a, b) => (mode === "max" ? b.value - a.value : a.value - b.value))
    .slice(0, n);
  return rows;
}

// ---------- data quality ----------

export interface QualityReport {
  totalRecords: number;
  cities: number;
  start: string;
  end: string;
  expectedDaysPerCity: number;
  numericCells: number;
  missingTotal: number;
  completenessPct: number;
  missingByColumn: { column: string; label: string; count: number; pct: number }[];
  missingByCity: { city: string; missingTotal: number }[];
  recordsPerCity: { city: string; records: number; expected: number; completenessPct: number }[];
  coverage: {
    city: string;
    start: string;
    end: string;
    expectedDays: number;
    presentDays: number;
    missingDays: number;
    continuityPct: number;
  }[];
  duplicatesRemoved: number;
  duplicatePairsRemaining: number;
  validation: {
    minAboveMax: number;
    meanOutsideRange: number;
    rainAbovePrecipitation: number;
    negativePrecipitation: number;
    gustBelowWind: number;
    heavyRainDays: number;
    temperaturePhysicallyImplausible: number;
  };
}

const COLUMN_LABELS: Record<string, string> = {
  city: "City",
  date: "Date",
  temperature_max: "Max temperature",
  temperature_min: "Min temperature",
  temperature_mean: "Mean temperature",
  precipitation: "Precipitation",
  rain: "Rain",
  wind_speed_max: "Max wind speed",
  wind_gusts_max: "Max wind gusts",
  year: "Year",
  month: "Month",
  month_name: "Month name",
  day: "Day",
};

export function buildQualityReport(records: WeatherRecord[], duplicatesRemoved: number, start: string, end: string): QualityReport {
  const byCity = groupBy(records, (r) => r.city);
  const cityNames = [...byCity.keys()];
  const expectedDaysPerCity = daysBetweenInclusive(start, end);

  const missingByColumn: QualityReport["missingByColumn"] = [];
  const numericKeys: (keyof WeatherRecord)[] = [
    "temperatureMax", "temperatureMin", "temperatureMean",
    "precipitation", "rain", "windSpeedMax", "windGustsMax",
  ];
  for (const key of numericKeys) {
    const snake = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    const count = records.filter((r) => r[key] === null).length;
    missingByColumn.push({
      column: snake,
      label: COLUMN_LABELS[snake] ?? key,
      count,
      pct: records.length ? Math.round((count / records.length) * 1000) / 10 : 0,
    });
  }

  const numericCells = records.length * numericKeys.length;
  const missingTotal = missingByColumn.reduce((s, c) => s + c.count, 0);

  let duplicatePairsRemaining = 0;
  const seen = new Set<string>();
  for (const r of records) {
    const key = `${r.city}|${r.date}`;
    if (seen.has(key)) duplicatePairsRemaining++;
    seen.add(key);
  }

  const coverage = cityNames.map((city) => {
    const cityRecords = byCity.get(city) ?? [];
    const dates = new Set(cityRecords.map((r) => r.date));
    return {
      city,
      start: cityRecords.length ? cityRecords.map((r) => r.date).sort()[0] : "",
      end: cityRecords.length ? cityRecords.map((r) => r.date).sort().at(-1) ?? "" : "",
      expectedDays: expectedDaysPerCity,
      presentDays: dates.size,
      missingDays: Math.max(0, expectedDaysPerCity - dates.size),
      continuityPct: expectedDaysPerCity ? Math.round((dates.size / expectedDaysPerCity) * 1000) / 10 : 0,
    };
  });

  // validation checks
  let minAboveMax = 0;
  let meanOutsideRange = 0;
  let rainAbovePrecipitation = 0;
  let negativePrecipitation = 0;
  let gustBelowWind = 0;
  let temperaturePhysicallyImplausible = 0;

  for (const r of records) {
    const { temperatureMax: tmax, temperatureMin: tmin, temperatureMean: tmean, precipitation: pr, rain: rn, windSpeedMax: ws, windGustsMax: wg } = r;
    if (tmin !== null && tmax !== null && tmin > tmax) minAboveMax++;
    if (tmean !== null && tmin !== null && tmax !== null && (tmean < tmin || tmean > tmax)) meanOutsideRange++;
    if (rn !== null && pr !== null && rn > pr) rainAbovePrecipitation++;
    if (pr !== null && pr < 0) negativePrecipitation++;
    if (wg !== null && ws !== null && wg < ws) gustBelowWind++;
    if (tmax !== null && (tmax > 55 || tmax < -15)) temperaturePhysicallyImplausible++;
    if (tmin !== null && (tmin > 50 || tmin < -25)) temperaturePhysicallyImplausible++;
  }

  const heavyRainDays = records.filter((r) => (r.precipitation ?? 0) >= 50).length;

  return {
    totalRecords: records.length,
    cities: cityNames.length,
    start,
    end,
    expectedDaysPerCity,
    numericCells,
    missingTotal,
    completenessPct: numericCells ? Math.round(((numericCells - missingTotal) / numericCells) * 1000) / 10 : 0,
    missingByColumn,
    missingByCity: cityNames.map((city) => ({
      city,
      missingTotal: numericKeys.reduce((s, key) => s + ((byCity.get(city) ?? []).filter((r) => r[key] === null).length), 0),
    })),
    recordsPerCity: cityNames.map((city) => ({
      city,
      records: (byCity.get(city) ?? []).length,
      expected: expectedDaysPerCity,
      completenessPct: expectedDaysPerCity
        ? Math.round(((byCity.get(city) ?? []).length / expectedDaysPerCity) * 1000) / 10
        : 0,
    })),
    coverage,
    duplicatesRemoved,
    duplicatePairsRemaining,
    validation: {
      minAboveMax,
      meanOutsideRange,
      rainAbovePrecipitation,
      negativePrecipitation,
      gustBelowWind,
      heavyRainDays,
      temperaturePhysicallyImplausible,
    },
  };
}

// ---------- records filtering / sorting / pagination ----------

export interface RecordQuery {
  search?: string;
  city?: string;
  year?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: string;
  page?: string;
  pageSize?: string;
}

const SORTABLE: Record<string, (r: WeatherRecord) => string | number | null> = {
  city: (r) => r.city,
  date: (r) => r.date,
  year: (r) => r.year,
  month: (r) => r.month,
  temperatureMax: (r) => r.temperatureMax,
  temperatureMin: (r) => r.temperatureMin,
  temperatureMean: (r) => r.temperatureMean,
  precipitation: (r) => r.precipitation,
  rain: (r) => r.rain,
  windSpeedMax: (r) => r.windSpeedMax,
  windGustsMax: (r) => r.windGustsMax,
};

export function queryRecords(
  records: WeatherRecord[],
  query: RecordQuery,
  options: { maxPageSize?: number } = {}
) {
  const search = (query.search ?? "").trim().toLowerCase();
  const city = query.city && query.city !== "all" ? query.city : "";
  const year = query.year && query.year !== "all" ? parseInt(query.year, 10) : NaN;
  const from = query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from) ? query.from : "";
  const to = query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to) ? query.to : "";

  let filtered = records;
  if (city) filtered = filtered.filter((r) => r.city === city);
  if (Number.isFinite(year)) filtered = filtered.filter((r) => r.year === year);
  if (from) filtered = filtered.filter((r) => r.date >= from);
  if (to) filtered = filtered.filter((r) => r.date <= to);
  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.city.toLowerCase().includes(search) ||
        r.date.includes(search) ||
        r.monthName.toLowerCase().includes(search)
    );
  }

  const sortKey = query.sort && SORTABLE[query.sort] ? query.sort : "date";
  const dir = query.dir === "asc" ? 1 : -1;
  const accessor = SORTABLE[sortKey];
  const sorted = [...filtered].sort((a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    if (va === null) return 1;
    if (vb === null) return -1;
    if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
    return ((va as number) - (vb as number)) * dir;
  });

  const maxPageSize = options.maxPageSize ?? 100;
  const pageSize = Math.min(Math.max(parseInt(query.pageSize ?? "15", 10) || 15, 5), maxPageSize);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(parseInt(query.page ?? "1", 10) || 1, 1), totalPages);
  const startIdx = (page - 1) * pageSize;
  const rows = sorted.slice(startIdx, startIdx + pageSize);

  return { rows, total: sorted.length, page, pageSize, totalPages, sort: sortKey, dir: dir === 1 ? "asc" : "desc" };
}

export function recordsToCsv(records: WeatherRecord[]): string {
  const header = [
    "city", "date", "year", "month", "month_name",
    "temperature_max", "temperature_min", "temperature_mean",
    "precipitation", "rain", "wind_speed_max", "wind_gusts_max",
  ];
  const lines = [header.join(",")];
  for (const r of records) {
    lines.push(
      [
        r.city, r.date, r.year, r.month, r.monthName,
        r.temperatureMax ?? "", r.temperatureMin ?? "", r.temperatureMean ?? "",
        r.precipitation ?? "", r.rain ?? "", r.windSpeedMax ?? "", r.windGustsMax ?? "",
      ].join(",")
    );
  }
  return lines.join("\n");
}
