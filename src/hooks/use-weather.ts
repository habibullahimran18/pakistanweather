"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  DailyResponse,
  MonthlyResponse,
  QualityReport,
  RecordsResponse,
  SeasonalResponse,
  SummaryResponse,
  YearlyResponse,
} from "@/lib/weather/api-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useSummary() {
  return useQuery<SummaryResponse>({
    queryKey: ["weather", "summary"],
    queryFn: () => fetchJson<SummaryResponse>("/api/weather/summary"),
    staleTime: Infinity,
    retry: 2,
  });
}

export function useMonthly(cities: string) {
  return useQuery<MonthlyResponse>({
    queryKey: ["weather", "monthly", cities],
    queryFn: () => fetchJson<MonthlyResponse>(`/api/weather/monthly?cities=${encodeURIComponent(cities)}`),
    staleTime: Infinity,
    retry: 2,
  });
}

export function useYearly(cities: string) {
  return useQuery<YearlyResponse>({
    queryKey: ["weather", "yearly", cities],
    queryFn: () => fetchJson<YearlyResponse>(`/api/weather/yearly?cities=${encodeURIComponent(cities)}`),
    staleTime: Infinity,
    retry: 2,
  });
}

export function useSeasonal(cities: string) {
  return useQuery<SeasonalResponse>({
    queryKey: ["weather", "seasonal", cities],
    queryFn: () => fetchJson<SeasonalResponse>(`/api/weather/seasonal?cities=${encodeURIComponent(cities)}`),
    staleTime: Infinity,
    retry: 2,
  });
}

export function useQuality() {
  return useQuery<QualityReport>({
    queryKey: ["weather", "quality"],
    queryFn: () => fetchJson<QualityReport>("/api/weather/quality"),
    staleTime: Infinity,
    retry: 2,
  });
}

export interface RecordsQueryState {
  search: string;
  city: string;
  year: string;
  from: string;
  to: string;
  sort: string;
  dir: string;
  page: number;
  pageSize: number;
}

function recordsToSearchParams(state: RecordsQueryState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.search.trim()) sp.set("search", state.search.trim());
  if (state.city && state.city !== "all") sp.set("city", state.city);
  if (state.year && state.year !== "all") sp.set("year", state.year);
  if (state.from) sp.set("from", state.from);
  if (state.to) sp.set("to", state.to);
  sp.set("sort", state.sort);
  sp.set("dir", state.dir);
  sp.set("page", String(state.page));
  sp.set("pageSize", String(state.pageSize));
  return sp;
}

export function useRecords(state: RecordsQueryState) {
  return useQuery<RecordsResponse>({
    queryKey: ["weather", "records", state],
    queryFn: () => fetchJson<RecordsResponse>(`/api/weather/records?${recordsToSearchParams(state).toString()}`),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

/** Build the CSV export URL sharing the explorer's current filters. */
export function recordsExportUrl(state: RecordsQueryState): string {
  const sp = recordsToSearchParams(state);
  sp.set("format", "csv");
  return `/api/weather/records?${sp.toString()}`;
}

export function useDaily(city: string | null) {
  return useQuery<DailyResponse>({
    queryKey: ["weather", "daily", city],
    queryFn: () => fetchJson<DailyResponse>(`/api/weather/daily?city=${encodeURIComponent(city ?? "")}`),
    staleTime: Infinity,
    enabled: Boolean(city),
    retry: 2,
  });
}

export interface ExtremesResponse {
  extremes: {
    hottest: { city: string; date: string; value: number } | null;
    coldest: { city: string; date: string; value: number } | null;
    wettest: { city: string; date: string; value: number } | null;
    windiestGust: { city: string; date: string; value: number } | null;
  };
  hottestDays: { city: string; date: string; value: number }[];
  coldestDays: { city: string; date: string; value: number }[];
  wettestDays: { city: string; date: string; value: number }[];
  windiestDays: { city: string; date: string; value: number }[];
}

export function useExtremes(cities: string) {
  return useQuery<ExtremesResponse>({
    queryKey: ["weather", "extremes", cities],
    queryFn: () => fetchJson<ExtremesResponse>(`/api/weather/extremes?cities=${encodeURIComponent(cities)}`),
    staleTime: Infinity,
    retry: 2,
  });
}
