/** API response contracts shared between route handlers and the client. */

import type { CityStat, HeatmapResult, QualityReport } from "./aggregate";
import type { MonthlyPoint, SeasonPoint, YearlyPoint } from "./aggregate";

export interface SummaryResponse {
  kpis: {
    totalRecords: number;
    cityCount: number;
    parameterCount: number;
    start: string;
    end: string;
    daysPerCity: number;
    missingTotal: number;
    completenessPct: number;
  };
  cities: CityStat[];
  extremes: {
    hottest: { city: string; date: string; value: number } | null;
    coldest: { city: string; date: string; value: number } | null;
    wettest: { city: string; date: string; value: number } | null;
    windiestGust: { city: string; date: string; value: number } | null;
  };
  meta: {
    source: string;
    timezone: string;
    generatedBy: string;
  };
}

export interface MonthlyResponse {
  months: string[];
  series: { city: string; points: MonthlyPoint[] }[];
}

export interface YearlyResponse {
  years: number[];
  series: { city: string; points: YearlyPoint[] }[];
}

export interface SeasonalResponse {
  seasons: { name: string; window: string }[];
  series: { city: string; points: SeasonPoint[] }[];
  heatmap: HeatmapResult;
  heatmapMetric: string;
}

export interface RecordsResponse {
  rows: {
    city: string;
    date: string;
    year: number;
    month: number;
    monthName: string;
    day: number;
    temperatureMax: number | null;
    temperatureMin: number | null;
    temperatureMean: number | null;
    precipitation: number | null;
    rain: number | null;
    windSpeedMax: number | null;
    windGustsMax: number | null;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort: string;
  dir: string;
}

export interface DailyResponse {
  city: string;
  points: {
    date: string;
    temperatureMax: number | null;
    temperatureMin: number | null;
    temperatureMean: number | null;
    precipitation: number | null;
    windSpeedMax: number | null;
    windGustsMax: number | null;
  }[];
}

export type { CityStat, MonthlyPoint, SeasonPoint, YearlyPoint, QualityReport, HeatmapResult };
