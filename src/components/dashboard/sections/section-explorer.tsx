"use client";

/**
 * DATA EXPLORER — search, filter, sort, paginate and export the full
 * daily weather dataset. Powered by GET /api/weather/records.
 */

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  RotateCcw,
  Search,
  SearchX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SECTION_BY_ID } from "@/components/dashboard/section-meta";
import {
  EmptyState,
  ErrorState,
  SectionBody,
  SectionHeader,
} from "@/components/dashboard/ui-bits";
import {
  recordsExportUrl,
  useRecords,
  type RecordsQueryState,
} from "@/hooks/use-weather";
import type { RecordsResponse } from "@/lib/weather/api-types";
import {
  cityColor,
  fmtDate,
  fmtInt,
  fmtKmh,
  fmtMm,
  fmtTemp,
} from "@/lib/weather/format";
import { CITY_NAMES } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

// ---------- types & constants ----------

type SortKey =
  | "city"
  | "date"
  | "temperatureMax"
  | "temperatureMin"
  | "temperatureMean"
  | "precipitation"
  | "rain"
  | "windSpeedMax"
  | "windGustsMax";

type NumericSortKey = Exclude<SortKey, "city" | "date">;

type RecordRow = RecordsResponse["rows"][number];

interface NumericColumn {
  key: NumericSortKey;
  label: string;
  format: (value: number | null) => string;
}

const DEFAULT_QUERY: RecordsQueryState = {
  search: "",
  city: "all",
  year: "all",
  from: "",
  to: "",
  sort: "date",
  dir: "desc",
  page: 1,
  pageSize: 15,
};

const SORT_LABELS: Record<SortKey, string> = {
  city: "City",
  date: "Date",
  temperatureMax: "Max temperature",
  temperatureMin: "Min temperature",
  temperatureMean: "Mean temperature",
  precipitation: "Precipitation",
  rain: "Rain",
  windSpeedMax: "Wind speed",
  windGustsMax: "Wind gusts",
};

const NUMERIC_COLUMNS: NumericColumn[] = [
  { key: "temperatureMax", label: "Max °C", format: (v) => fmtTemp(v, false) },
  { key: "temperatureMin", label: "Min °C", format: (v) => fmtTemp(v, false) },
  { key: "temperatureMean", label: "Mean °C", format: (v) => fmtTemp(v, false) },
  { key: "precipitation", label: "Precipitation (mm)", format: (v) => fmtMm(v, false) },
  { key: "rain", label: "Rain (mm)", format: (v) => fmtMm(v, false) },
  { key: "windSpeedMax", label: "Wind (km/h)", format: (v) => fmtKmh(v, false) },
  { key: "windGustsMax", label: "Gusts (km/h)", format: (v) => fmtKmh(v, false) },
];

const YEARS = ["2024", "2025"];

const PAGE_SIZES = [15, 25, 50, 100];

const STATIC_HEAD_CLASS =
  "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

const SKELETON_COLS: { w: string; right?: boolean }[] = [
  { w: "w-24" },
  { w: "w-24" },
  { w: "w-10" },
  { w: "w-14" },
  { w: "w-12", right: true },
  { w: "w-12", right: true },
  { w: "w-12", right: true },
  { w: "w-16", right: true },
  { w: "w-12", right: true },
  { w: "w-12", right: true },
  { w: "w-12", right: true },
];

// ---------- sortable header ----------

function SortableHead({
  label,
  sortKey,
  sort,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: string;
  dir: string;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort === sortKey;
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-3 py-2.5", align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
          align === "right" && "flex-row-reverse",
          active ? "text-lav" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <Icon
          className={cn("h-3 w-3 shrink-0", !active && "opacity-40")}
          aria-hidden
        />
      </button>
    </TableHead>
  );
}

// ---------- cell helpers ----------

function tempHintClass(col: NumericColumn, row: RecordRow): string | undefined {
  if (col.key === "temperatureMax" && row.temperatureMax !== null && row.temperatureMax >= 40) {
    return "text-terra";
  }
  if (col.key === "temperatureMin" && row.temperatureMin !== null && row.temperatureMin <= 0) {
    return "text-aqua";
  }
  return undefined;
}

// ---------- section ----------

export default function SectionExplorer() {
  const meta = SECTION_BY_ID.explorer;

  const [state, setState] = useState<RecordsQueryState>(DEFAULT_QUERY);
  const [searchInput, setSearchInput] = useState("");
  const [pageInput, setPageInput] = useState("1");

  const { data, isLoading, isFetching, isError, error, refetch } = useRecords(state);

  // Debounce the search box (~300ms) into the server query state.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setState((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }
      );
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Derived pagination values (from the response when available).
  const total = data?.total ?? 0;
  const page = data?.page ?? state.page;
  const pageSize = data?.pageSize ?? state.pageSize;
  const totalPages = data?.totalPages ?? 0;
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  // Keep the jump-to-page input in sync with the server page.
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const activeFilterCount = [
    state.search.trim().length > 0,
    state.city !== "all",
    state.year !== "all",
    state.from !== "",
    state.to !== "",
  ].filter(Boolean).length;

  function patchFilters(patch: Partial<RecordsQueryState>) {
    setState((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }

  function handleSort(key: SortKey) {
    setState((prev) => {
      if (prev.sort === key) {
        return { ...prev, dir: prev.dir === "asc" ? "desc" : "asc", page: 1 };
      }
      // Text columns read naturally ascending; numeric columns start highest-first.
      const nextDir = key === "city" || key === "date" ? "asc" : "desc";
      return { ...prev, sort: key, dir: nextDir, page: 1 };
    });
  }

  function resetFilters() {
    setSearchInput("");
    setState({ ...DEFAULT_QUERY });
  }

  function handleExportCsv() {
    const url = recordsExportUrl(state);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pakistan-weatherwatch-records.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleJumpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = Number.parseInt(pageInput, 10);
    if (Number.isNaN(n)) {
      setPageInput(String(page));
      return;
    }
    const target = Math.min(Math.max(n, 1), Math.max(totalPages, 1));
    if (target === state.page) {
      setPageInput(String(target));
      return;
    }
    setState((s) => ({ ...s, page: target }));
  }

  const headerRow = (
    <TableRow className="border-border/70 bg-panel-2/60 hover:bg-panel-2/60">
      <SortableHead
        label="City"
        sortKey="city"
        sort={state.sort}
        dir={state.dir}
        onSort={handleSort}
      />
      <SortableHead
        label="Date"
        sortKey="date"
        sort={state.sort}
        dir={state.dir}
        onSort={handleSort}
      />
      <TableHead scope="col" className={STATIC_HEAD_CLASS}>
        Year
      </TableHead>
      <TableHead scope="col" className={STATIC_HEAD_CLASS}>
        Month
      </TableHead>
      {NUMERIC_COLUMNS.map((col) => (
        <SortableHead
          key={col.key}
          label={col.label}
          sortKey={col.key}
          sort={state.sort}
          dir={state.dir}
          onSort={handleSort}
          align="right"
        />
      ))}
    </TableRow>
  );

  return (
    <SectionBody>
      <SectionHeader title={meta.title} subtitle={meta.subtitle} />

      {/* Toolbar */}
      <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(43,35,80,0.08)] sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet/40 to-transparent opacity-60"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search city, date or month…"
              aria-label="Search records by city, date or month"
              className="pl-8"
            />
          </div>

          <Select value={state.city} onValueChange={(v) => patchFilters({ city: v })}>
            <SelectTrigger size="sm" className="w-[150px]" aria-label="Filter by city">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {CITY_NAMES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.year} onValueChange={(v) => patchFilters({ year: v })}>
            <SelectTrigger size="sm" className="w-[120px]" aria-label="Filter by year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={state.from}
              onChange={(e) => patchFilters({ from: e.target.value })}
              aria-label="From date"
              className="w-[145px]"
            />
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              type="date"
              value={state.to}
              onChange={(e) => patchFilters({ to: e.target.value })}
              aria-label="To date"
              className="w-[145px]"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="outline"
              aria-label={`${activeFilterCount} active filters`}
              className={cn(
                "tabular",
                activeFilterCount > 0
                  ? "border-lav/30 bg-lav/10 text-lav"
                  : "border-border/80 text-muted-foreground"
              )}
            >
              {activeFilterCount} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Reset all filters to defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={!data}
              className="gap-1.5 border-violet/25 text-violet hover:bg-violet/10 hover:text-lav"
              aria-label="Export the current filtered result as CSV"
            >
              <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Results card */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(43,35,80,0.08)]">
        {/* Meta row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-panel-2/30 px-4 py-3 sm:px-5">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing{" "}
            <span className="tabular font-medium text-foreground">
              {fmtInt(showingFrom)}–{fmtInt(showingTo)}
            </span>{" "}
            of <span className="tabular font-medium text-foreground">{fmtInt(total)}</span> records
            {data && isFetching ? <span className="ml-2 text-lav/90">· updating…</span> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            Sorted by{" "}
            <span className="font-medium text-foreground">{SORT_LABELS[state.sort as SortKey]}</span>
            {" "}· {state.dir === "asc" ? "ascending" : "descending"}
          </p>
        </div>

        {/* Table / states */}
        {isError ? (
          <div className="px-4 py-8 sm:px-5">
            <ErrorState
              message={error?.message ?? "Failed to load weather records."}
              onRetry={() => refetch()}
            />
          </div>
        ) : data && data.rows.length === 0 ? (
          <div className="px-4 py-8 sm:px-5">
            <EmptyState
              icon={SearchX}
              title="No records match your filters"
              description="Try a different city, year or date range — or clear the filters to browse the full dataset."
              action={
                <Button variant="outline" size="sm" onClick={resetFilters} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset filters
                </Button>
              }
            />
          </div>
        ) : (
          <div
            className={cn(
              "ww-scroll overflow-x-auto [&_[data-slot=table-container]]:overflow-x-visible",
              data && isFetching && "opacity-60 transition-opacity duration-300"
            )}
          >
            <Table className="min-w-[1080px]">
              <TableHeader>{headerRow}</TableHeader>
              <TableBody>
                {!data
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`} className="border-border/50">
                        {SKELETON_COLS.map((c, j) => (
                          <TableCell
                            key={j}
                            className={cn("px-3 py-3", c.right && "text-right")}
                          >
                            <Skeleton
                              className={cn("h-3.5 rounded-md bg-violet/[0.07]", c.w, c.right && "ml-auto")}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : data.rows.map((row) => (
                      <TableRow key={`${row.city}-${row.date}`} className="border-border/50">
                        <TableCell className="px-3 py-2.5">
                          <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                            <span
                              aria-hidden
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: cityColor(row.city) }}
                            />
                            {row.city}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-[13px] text-foreground/90">
                          {fmtDate(row.date)}
                        </TableCell>
                        <TableCell className="tabular px-3 py-2.5 text-[13px] text-muted-foreground">
                          {row.year}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-[13px] text-muted-foreground">
                          {row.monthName.slice(0, 3)}
                        </TableCell>
                        {NUMERIC_COLUMNS.map((col) => (
                          <TableCell
                            key={col.key}
                            className="tabular px-3 py-2.5 text-right text-[13px] text-foreground"
                          >
                            <span className={tempHintClass(col, row)}>{col.format(row[col.key])}</span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState((s) => ({ ...s, page: Math.min(totalPages, s.page + 1) }))}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <span className="tabular ml-1 text-xs text-muted-foreground">
              Page <span className="font-medium text-foreground">{page}</span> of{" "}
              <span className="font-medium text-foreground">{Math.max(totalPages, 1)}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <form className="flex items-center gap-1.5" onSubmit={handleJumpSubmit}>
              <Input
                type="number"
                min={1}
                max={Math.max(totalPages, 1)}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                aria-label="Go to page number"
                className="h-8 w-[72px] text-sm"
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Go
              </Button>
            </form>
            <Select
              value={String(state.pageSize)}
              onValueChange={(v) => patchFilters({ pageSize: Number(v) })}
            >
              <SelectTrigger size="sm" className="w-[110px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Export CSV honours every active filter and the current sort order, and always includes the
        full filtered result set — not just the visible page. Rows are daily observations per city
        from the cleaned dataset ETL output.
      </p>
    </SectionBody>
  );
}
