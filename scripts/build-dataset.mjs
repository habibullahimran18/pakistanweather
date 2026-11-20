/**
 * Pakistan WeatherWatch — dataset preparation script.
 *
 * This script mirrors the project's Python ETL pipeline (src/extract.py ->
 * src/transform.py -> src/load.py) using Node/Bun, producing compatible
 * artifacts so the frontend can be developed against the exact schema the
 * Python pipeline emits. The Python files themselves remain untouched.
 *
 * Outputs:
 *   data/raw/weather_raw.json        (extract.py format)
 *   data/processed/weather_clean.csv (transform.py schema)
 *   data/database/weather.db         (load.py: daily_weather table)
 *
 * Run: bun scripts/build-dataset.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";

// ---------- CONFIGURATION (mirrors src/extract.py) ----------

const URL = "https://archive-api.open-meteo.com/v1/archive";
const START_DATE = "2024-01-01";
const END_DATE = "2025-12-31";

const CITIES = {
  Lahore: { latitude: 31.5204, longitude: 74.3587 },
  Karachi: { latitude: 24.8607, longitude: 67.0011 },
  Islamabad: { latitude: 33.6844, longitude: 73.0479 },
  Peshawar: { latitude: 34.0151, longitude: 71.5249 },
  Quetta: { latitude: 30.1798, longitude: 66.975 },
};

const ROOT = path.resolve(import.meta.dir, "..");
const RAW_PATH = path.join(ROOT, "data", "raw", "weather_raw.json");
const CSV_PATH = path.join(ROOT, "data", "processed", "weather_clean.csv");
const DB_PATH = path.join(ROOT, "data", "database", "weather.db");
const PROJECT = path.join(ROOT, "Pakistan-WeatherWatch");

// ---------- EXTRACT WEATHER DATA ----------

const weatherData = {};

for (const [city, coordinates] of Object.entries(CITIES)) {
  process.stdout.write(`Extracting weather data for ${city}...`);
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    start_date: START_DATE,
    end_date: END_DATE,
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "temperature_2m_mean",
      "precipitation_sum",
      "rain_sum",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
    ].join(","),
    timezone: "Asia/Karachi",
  });

  const response = await fetch(`${URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Could not extract ${city}: HTTP ${response.status}`);
  }
  const cityData = await response.json();
  if (!cityData.daily || !cityData.daily.time) {
    throw new Error(`Daily weather data is missing for ${city}`);
  }
  weatherData[city] = cityData;
  console.log(` ok (${cityData.daily.time.length} days)`);
}

// ---------- SAVE RAW DATA (extract.py format) ----------

fs.mkdirSync(path.dirname(RAW_PATH), { recursive: true });
const raw_data = {
  extracted_at: new Date().toISOString(),
  start_date: START_DATE,
  end_date: END_DATE,
  cities: weatherData,
};
fs.writeFileSync(RAW_PATH, JSON.stringify(raw_data, null, 4));
console.log(`Raw data saved to: ${path.relative(ROOT, RAW_PATH)}`);

// ---------- TRANSFORM WEATHER DATA (transform.py schema) ----------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const weatherRecords = [];

for (const [city, cityData] of Object.entries(raw_data.cities)) {
  const dailyData = cityData.daily;

  for (let index = 0; index < dailyData.time.length; index++) {
    const date = dailyData.time[index];
    const [year, month, day] = date.split("-").map((n) => parseInt(n, 10));

    weatherRecords.push({
      city,
      date,
      temperature_max: dailyData.temperature_2m_max[index],
      temperature_min: dailyData.temperature_2m_min[index],
      temperature_mean: dailyData.temperature_2m_mean[index],
      precipitation: dailyData.precipitation_sum[index],
      rain: dailyData.rain_sum[index],
      wind_speed_max: dailyData.wind_speed_10m_max[index],
      wind_gusts_max: dailyData.wind_gusts_10m_max[index],
      year,
      month,
      month_name: MONTH_NAMES[month - 1],
      day,
    });
  }
}

// ---------- DATA CLEANING ----------

const seen = new Set();
const deduped = weatherRecords.filter((r) => {
  const key = `${r.city}|${r.date}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
deduped.sort((a, b) => (a.city === b.city ? (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) : a.city < b.city ? -1 : 1));

const COLUMNS = [
  "city", "date", "temperature_max", "temperature_min", "temperature_mean",
  "precipitation", "rain", "wind_speed_max", "wind_gusts_max",
  "year", "month", "month_name", "day",
];

const NUMERIC = new Set([
  "temperature_max", "temperature_min", "temperature_mean",
  "precipitation", "rain", "wind_speed_max", "wind_gusts_max",
]);

const formatCell = (record, column) => {
  const value = record[column];
  if (value === null || value === undefined) return "";
  if (NUMERIC.has(column)) {
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    return String(num);
  }
  return String(value);
};

fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
const csvLines = [COLUMNS.join(",")];
for (const record of deduped) {
  csvLines.push(COLUMNS.map((c) => formatCell(record, c)).join(","));
}
fs.writeFileSync(CSV_PATH, csvLines.join("\n") + "\n");
console.log(`Clean data saved to: ${path.relative(ROOT, CSV_PATH)} (${deduped.length} records)`);

// ---------- LOAD DATA INTO SQLITE (load.py: daily_weather) ----------

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);

const db = new Database(DB_PATH);
db.exec(`CREATE TABLE daily_weather (
  city TEXT,
  date TEXT,
  temperature_max REAL,
  temperature_min REAL,
  temperature_mean REAL,
  precipitation REAL,
  rain REAL,
  wind_speed_max REAL,
  wind_gusts_max REAL,
  year INTEGER,
  month INTEGER,
  month_name TEXT,
  day INTEGER
)`);

const insert = db.prepare(
  `INSERT INTO daily_weather (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`
);
db.exec("BEGIN");
for (const record of deduped) {
  insert.run(...COLUMNS.map((c) => (record[c] === undefined ? null : record[c])));
}
db.exec("COMMIT");

const totalRecords = db.prepare("SELECT COUNT(*) FROM daily_weather").get();
const totalCities = db.prepare("SELECT COUNT(DISTINCT city) FROM daily_weather").get();
db.close();
console.log(`Database saved to: ${path.relative(ROOT, DB_PATH)} (${totalRecords["COUNT(*)"]} records, ${totalCities["COUNT(DISTINCT city)"]} cities)`);

// ---------- MIRROR ARTIFACTS INTO THE PYTHON PROJECT ----------

if (fs.existsSync(PROJECT)) {
  const mirror = [
    [RAW_PATH, path.join(PROJECT, "data", "raw", "weather_raw.json")],
    [CSV_PATH, path.join(PROJECT, "data", "processed", "weather_clean.csv")],
    [DB_PATH, path.join(PROJECT, "data", "database", "weather.db")],
  ];
  for (const [src, dest] of mirror) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  console.log("Artifacts mirrored into Pakistan-WeatherWatch/data/");
}

// ---------- SUMMARY ----------

const missing = {};
for (const col of COLUMNS) {
  missing[col] = deduped.filter((r) => r[col] === null || r[col] === undefined || (NUMERIC.has(col) && Number.isNaN(Number(r[col])))).length;
}
console.log("\n---------- DATASET SUMMARY ----------");
console.log(`Total records: ${deduped.length}`);
console.log(`Cities: ${Object.keys(CITIES).length}`);
console.log(`Date range: ${deduped[0]?.date} -> ${deduped[deduped.length - 1]?.date}`);
console.log("Missing values per column:", JSON.stringify(missing, null, 0));
