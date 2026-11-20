/**
 * Server-side dataset loader.
 *
 * Reads the ETL-produced `data/processed/weather_clean.csv`, parses it into
 * typed records and caches the result for the lifetime of the server process
 * (the dataset is static historical data).
 */

import fs from "node:fs";
import path from "node:path";
import { csvToObjects } from "./csv";
import type { WeatherRecord } from "./types";

export interface Dataset {
  records: WeatherRecord[];
  cities: string[];
  start: string;
  end: string;
  rawRowCount: number;
  duplicatesRemoved: number;
  missingByColumn: Record<string, number>;
  loadedFrom: string;
  loadedAt: string;
}

export class DatasetUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatasetUnavailableError";
  }
}

const NUMERIC_COLUMNS = [
  "temperature_max",
  "temperature_min",
  "temperature_mean",
  "precipitation",
  "rain",
  "wind_speed_max",
  "wind_gusts_max",
] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

let cache: Dataset | null = null;

function candidatePaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, "data", "processed", "weather_clean.csv"),
    path.join(cwd, "Pakistan-WeatherWatch", "data", "processed", "weather_clean.csv"),
    path.join(cwd, "..", "data", "processed", "weather_clean.csv"),
    path.join(cwd, "..", "..", "data", "processed", "weather_clean.csv"),
  ];
}

function toNumber(value: string | undefined): number | null {
  if (value === undefined || value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function loadFromDisk(): Dataset {
  const candidates = candidatePaths();
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    throw new DatasetUnavailableError(
      `weather_clean.csv not found. Looked in: ${candidates.join(", ")}. ` +
        `Run the Python ETL pipeline (python -m src.main) or "bun scripts/build-dataset.mjs" to generate it.`
    );
  }

  const text = fs.readFileSync(filePath, "utf8");
  const objects = csvToObjects(text);
  if (objects.length === 0) {
    throw new DatasetUnavailableError(`weather_clean.csv at ${filePath} contains no records.`);
  }

  const seen = new Set<string>();
  const records: WeatherRecord[] = [];
  let duplicatesRemoved = 0;
  const missingByColumn: Record<string, number> = {};

  for (const obj of objects) {
    const city = (obj.city ?? "").trim();
    const date = (obj.date ?? "").trim();
    if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const key = `${city}|${date}`;
    if (seen.has(key)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(key);

    let [year, month, day] = date.split("-").map((n) => parseInt(n, 10));

    const parsedYear = parseInt(obj.year ?? "", 10);
    const parsedMonth = parseInt(obj.month ?? "", 10);
    const parsedDay = parseInt(obj.day ?? "", 10);
    if (Number.isFinite(parsedYear)) year = parsedYear;
    if (Number.isFinite(parsedMonth)) month = parsedMonth;
    if (Number.isFinite(parsedDay)) day = parsedDay;

    const monthName = (obj.month_name ?? "").trim() || MONTH_NAMES[(month || 1) - 1] || "";

    const record: WeatherRecord = {
      city,
      date,
      temperatureMax: toNumber(obj.temperature_max),
      temperatureMin: toNumber(obj.temperature_min),
      temperatureMean: toNumber(obj.temperature_mean),
      precipitation: toNumber(obj.precipitation),
      rain: toNumber(obj.rain),
      windSpeedMax: toNumber(obj.wind_speed_max),
      windGustsMax: toNumber(obj.wind_gusts_max),
      year,
      month,
      monthName,
      day,
    };

    for (const col of NUMERIC_COLUMNS) {
      const camel = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (record[camel as keyof WeatherRecord] === null) {
        missingByColumn[col] = (missingByColumn[col] ?? 0) + 1;
      }
    }

    records.push(record);
  }

  if (records.length === 0) {
    throw new DatasetUnavailableError(`weather_clean.csv at ${filePath} contained no valid rows.`);
  }

  // Sort by city, then date (mirrors transform.py output order)
  records.sort((a, b) => (a.city === b.city ? (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) : a.city < b.city ? -1 : 1));

  return {
    records,
    cities: [...new Set(records.map((r) => r.city))],
    start: records[0].date,
    end: records[records.length - 1].date,
    rawRowCount: objects.length,
    duplicatesRemoved,
    missingByColumn,
    loadedFrom: filePath,
    loadedAt: new Date().toISOString(),
  };
}

/** Get (and memoize) the parsed dataset. Throws DatasetUnavailableError. */
export function getDataset(): Dataset {
  if (!cache) {
    cache = loadFromDisk();
  }
  return cache;
}

/** Test-only helper. */
export function resetDatasetCache(): void {
  cache = null;
}
