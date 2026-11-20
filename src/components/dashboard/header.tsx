"use client";

import { CalendarRange, Database, Globe2, Menu } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WeatherWatchWordmark } from "./logo";
import { NAV_GROUPS, SECTION_BY_ID } from "./section-meta";
import { useDashboard } from "@/lib/store";
import { useSummary } from "@/hooks/use-weather";
import { fmtDateRange, fmtInt } from "@/lib/weather/format";
import { CITY_NAMES } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

function CityFilterSelect({ className }: { className?: string }) {
  const cityFilter = useDashboard((s) => s.cityFilter);
  const setCityFilter = useDashboard((s) => s.setCityFilter);

  return (
    <Select value={cityFilter} onValueChange={setCityFilter}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-9 w-[210px] gap-1.5 border-border/80 bg-card/70 text-xs [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate",
          className
        )}
        aria-label="Filter data by city"
      >
        <Globe2 className="h-3.5 w-3.5 shrink-0 text-fog" aria-hidden />
        <SelectValue placeholder="All cities" />
      </SelectTrigger>
      <SelectContent className="border-border bg-popover">
        <SelectItem value="all" className="text-xs">
          All cities (5-city view)
        </SelectItem>
        {CITY_NAMES.map((city) => (
          <SelectItem key={city} value={city} className="text-xs">
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Header() {
  const section = useDashboard((s) => s.section);
  const mobileNavOpen = useDashboard((s) => s.mobileNavOpen);
  const setMobileNavOpen = useDashboard((s) => s.setMobileNavOpen);
  const setSection = useDashboard((s) => s.setSection);
  const meta = SECTION_BY_ID[section];
  const { data, isLoading } = useSummary();
  const Icon = meta.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1560px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile navigation */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-md border border-border/70 bg-card/60 p-2 text-fog transition-colors hover:text-foreground lg:hidden"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-4 w-4" aria-hidden />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-white/15 bg-gradient-to-b from-[#8B7CF6] via-[#7C5CE0] to-[#6443D6] p-0">
            <SheetHeader className="border-b border-white/15 px-4 py-3.5 text-left">
              <SheetTitle asChild>
                <div>
                  <WeatherWatchWordmark />
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="ww-scroll h-[calc(100%-64px)] overflow-y-auto px-3 py-4" aria-label="Dashboard sections">
              {NAV_GROUPS.map((group, gi) => (
                <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
                  <div className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = section === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSection(item.id)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            active ? "bg-white/[0.16] text-white" : "text-white/70 hover:bg-white/[0.10] hover:text-white"
                          )}
                        >
                          <ItemIcon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-white/55")} aria-hidden />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Page identity */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden h-9 w-9 items-center justify-center rounded-lg border border-violet/25 bg-violet/10 sm:flex">
            <Icon className="h-4 w-4 text-lav" aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{meta.title}</h1>
            <p className="hidden truncate text-xs text-muted-foreground md:block">{meta.shortLabel} · Pakistan WeatherWatch</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Historical dataset indicator */}
          <span
            className="hidden items-center gap-1.5 rounded-full border border-violet/25 bg-violet/10 px-2.5 py-1 text-[11px] font-medium text-lav xl:inline-flex"
            title="Static historical dataset loaded from the cleaned ETL output"
          >
            <Database className="h-3 w-3" aria-hidden />
            Historical dataset
          </span>

          {/* Date range indicator */}
          <span
            className="tabular hidden items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-2.5 py-1 text-[11px] text-secondary-foreground lg:inline-flex"
            title="Dataset coverage"
          >
            <CalendarRange className="h-3 w-3 text-fog" aria-hidden />
            {isLoading || !data ? "2024 – 2025" : fmtDateRange(data.kpis.start, data.kpis.end)}
          </span>

          <span className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-2.5 py-1 text-[11px] text-secondary-foreground xl:inline-flex" title="Total daily records">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lav" aria-hidden />
            {isLoading || !data ? "—" : `${fmtInt(data.kpis.totalRecords)} records`}
          </span>

          <span className="hidden sm:block">
            <CityFilterSelect />
          </span>
        </div>
      </div>
      {/* Signature gradient hairline — violet fading to transparent */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-violet/50 via-violet/[0.12] to-transparent"
      />
    </header>
  );
}

export { CityFilterSelect };
