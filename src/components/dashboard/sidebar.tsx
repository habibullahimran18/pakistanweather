"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WeatherWatchWordmark } from "./logo";
import { NAV_GROUPS, SECTION_BY_ID } from "./section-meta";
import { useDashboard } from "@/lib/store";
import { useSummary } from "@/hooks/use-weather";
import { fmtInt } from "@/lib/weather/format";
import { cn } from "@/lib/utils";

function NavItem({
  id,
  collapsed,
  onSelect,
}: {
  id: keyof typeof SECTION_BY_ID;
  collapsed: boolean;
  onSelect: () => void;
}) {
  const meta = SECTION_BY_ID[id];
  const active = useDashboard((s) => s.section === id);
  const Icon = meta.icon;

  const button = (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
        collapsed ? "justify-center px-0" : "",
        active
          ? "bg-white/[0.16] text-white"
          : "text-white/70 hover:bg-white/[0.10] hover:text-white"
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-white"
        />
      ) : null}
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-white" : "text-white/55 group-hover:text-white")}
        aria-hidden
      />
      {collapsed ? null : <span className="truncate">{meta.label}</span>}
    </button>
  );

  if (!collapsed) return button;
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {meta.label}
      </TooltipContent>
    </Tooltip>
  );
}

function DatasetChip({ collapsed }: { collapsed: boolean }) {
  const { data, isLoading } = useSummary();
  if (collapsed) {
    return (
      <div className="flex justify-center py-1" title="Open-Meteo archive · 2024–2025">
        <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/25 bg-white/[0.12] p-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-white/70">
        <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]" aria-hidden />
        Historical dataset
      </div>
      <div className="mt-1.5 text-xs font-medium text-white">Open-Meteo Archive API</div>
      <div className="tabular mt-0.5 text-[11px] text-white/60">
        {isLoading ? "Loading dataset…" : `${fmtInt(data?.kpis.totalRecords)} records · 2024–2025`}
      </div>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useDashboard((s) => s.sidebarCollapsed);
  const setSection = useDashboard((s) => s.setSection);
  const toggleSidebar = useDashboard((s) => s.toggleSidebar);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/15 bg-gradient-to-b from-[#8B7CF6] via-[#7C5CE0] to-[#6443D6] lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
        "transition-[width] duration-300 ease-in-out"
      )}
    >
      <div className={cn("flex items-center justify-between border-b border-white/15 px-4", collapsed ? "h-16 justify-center px-0" : "h-16")}>
        <WeatherWatchWordmark collapsed={collapsed} />
        {!collapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <TooltipProvider delayDuration={150}>
        <nav className="ww-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard sections">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 ? "mt-5" : "")}>
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-white/25" aria-hidden />
              ) : (
                <div className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.id} id={item.id} collapsed={collapsed} onSelect={() => setSection(item.id)} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </TooltipProvider>

      <div className={cn("border-t border-white/15 p-3", collapsed ? "px-2" : "")}>
        <DatasetChip collapsed={collapsed} />
        {collapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="mt-2 flex w-full justify-center rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
