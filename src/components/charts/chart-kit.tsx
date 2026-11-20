"use client";

/**
 * WeatherWatch chart kit — consistent Recharts styling across all sections.
 * Dark card surfaces, violet/lavender accents, subtle grids, elegant tooltips.
 */

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Cell,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_AXIS, CHART_GRID, cityColor } from "@/lib/weather/format";

// ---------- Chart card shell ----------

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className = "",
  footer,
  contentClassName = "",
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className={"relative overflow-hidden border-border/80 bg-card hover:border-violet/25 transition-colors " + className}>
      {/* 1px inner top highlight — depth without shadows */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-violet/[0.05]" />
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
        <div className="min-w-0">
          <CardTitle className="text-[15px] font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </CardTitle>
          {subtitle ? (
            <CardDescription className="mt-1 text-xs leading-snug text-muted-foreground">
              {subtitle}
            </CardDescription>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
      {footer ? (
        <div className="border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">{footer}</div>
      ) : null}
    </Card>
  );
}

// ---------- Custom tooltip ----------

interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | null;
  color?: string;
  fill?: string;
  stroke?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  valueLabels,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  formatter?: (value: number | null, seriesKey: string) => string;
  labelFormatter?: (label: string | number) => string;
  valueLabels?: Record<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const items = payload.filter((p) => p.value !== null && p.value !== undefined && p.value !== "");
  if (items.length === 0) return null;

  return (
    <div className="min-w-[168px] rounded-lg border border-violet/15 bg-popover/95 px-3 py-2.5 shadow-xl backdrop-blur-sm">
      {label !== undefined ? (
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      ) : null}
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const keyStr = String(item.dataKey ?? "");
          const numeric =
            typeof item.value === "number" ? item.value : Number(item.value ?? NaN);
          const color = item.color ?? item.fill ?? item.stroke ?? "#6C4DE0";
          return (
            <div key={`${keyStr}-${idx}`} className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="truncate text-xs text-secondary-foreground">
                  {valueLabels?.[keyStr] ?? item.name ?? keyStr}
                </span>
              </div>
              <span className="tabular shrink-0 text-xs font-semibold text-lav">
                {Number.isFinite(numeric) && formatter
                  ? formatter(numeric, keyStr)
                  : String(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Series toggle legend ----------

function SeriesLegend({
  items,
  hidden,
  onToggle,
}: {
  items: { key: string; label: string; color: string }[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => {
        const isHidden = hidden.has(item.key);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggle(item.key)}
            className={
              "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors hover:bg-violet/[0.07] " +
              (isHidden ? "text-muted-foreground/50" : "text-secondary-foreground")
            }
            aria-pressed={!isHidden}
          >
            <span
              className="h-2 w-2 rounded-full transition-opacity"
              style={{ backgroundColor: item.color, opacity: isHidden ? 0.25 : 1 }}
              aria-hidden
            />
            <span className={isHidden ? "line-through decoration-ink/30" : ""}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- shared series type ----------

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
  strokeWidth?: number;
  dashed?: boolean;
  barSize?: number;
  radius?: [number, number, number, number];
}

const AXIS_PROPS = {
  tick: { fill: CHART_AXIS, fontSize: 11 },
  axisLine: { stroke: "rgba(43,35,80,0.14)" },
  tickLine: false,
} as const;

function useHiddenSeries(series: SeriesDef[]) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const visible = useMemo(() => series.filter((s) => !hidden.has(s.key)), [series, hidden]);
  return { hidden, toggle, visible };
}

// ---------- Line chart ----------

export function LineSeriesChart({
  data,
  series,
  xKey,
  height = 320,
  yFormatter,
  xFormatter,
  yDomain,
  unit,
  showLegend = true,
  legendPosition = "top",
  syncId,
}: {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  xKey: string;
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: string | number) => string;
  yDomain?: [number | "auto", number | "auto" | "dataMax"];
  unit?: string;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom";
  syncId?: string;
}) {
  const { hidden, toggle, visible } = useHiddenSeries(series);
  const legend = (
    <SeriesLegend
      items={series.map(({ key, label, color }) => ({ key, label, color }))}
      hidden={hidden}
      onToggle={toggle}
    />
  );

  return (
    <div>
      {showLegend && legendPosition === "top" ? <div className="mb-3">{legend}</div> : null}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} syncId={syncId}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            {...AXIS_PROPS}
            tickFormatter={xFormatter}
            minTickGap={28}
            tickMargin={8}
          />
          <YAxis
            {...AXIS_PROPS}
            width={46}
            axisLine={false}
            tickFormatter={yFormatter}
            domain={yDomain ?? ["auto", "auto"]}
            tickMargin={4}
          />
          <RechartsTooltip
            cursor={{ stroke: "rgba(43,35,80,0.30)", strokeWidth: 1 }}
            content={
              <ChartTooltip
                formatter={(v) => `${v?.toFixed(1)}${unit ?? ""}`}
                labelFormatter={xFormatter}
                valueLabels={Object.fromEntries(series.map((s) => [s.key, s.label]))}
              />
            }
          />
          {visible.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={s.strokeWidth ?? 2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {showLegend && legendPosition === "bottom" ? <div className="mt-2">{legend}</div> : null}
    </div>
  );
}

// ---------- Area chart (single or stacked) ----------

export function AreaSeriesChart({
  data,
  series,
  xKey,
  height = 320,
  yFormatter,
  xFormatter,
  unit,
  showLegend = true,
}: {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  xKey: string;
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: string | number) => string;
  unit?: string;
  showLegend?: boolean;
}) {
  const { hidden, toggle, visible } = useHiddenSeries(series);
  return (
    <div>
      {showLegend ? (
        <div className="mb-3">
          <SeriesLegend
            items={series.map(({ key, label, color }) => ({ key, label, color }))}
            hidden={hidden}
            onToggle={toggle}
          />
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            {visible.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            {...AXIS_PROPS}
            tickFormatter={xFormatter}
            minTickGap={28}
            tickMargin={8}
          />
          <YAxis {...AXIS_PROPS} width={46} axisLine={false} tickFormatter={yFormatter} tickMargin={4} />
          <RechartsTooltip
            cursor={{ stroke: "rgba(43,35,80,0.30)", strokeWidth: 1 }}
            content={
              <ChartTooltip
                formatter={(v) => `${v?.toFixed(1)}${unit ?? ""}`}
                labelFormatter={xFormatter}
                valueLabels={Object.fromEntries(series.map((s) => [s.key, s.label]))}
              />
            }
          />
          {visible.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Bar chart ----------

export function BarSeriesChart({
  data,
  series,
  xKey,
  height = 320,
  yFormatter,
  xFormatter,
  unit,
  layout = "horizontal",
  showLegend = true,
  stacked = false,
  valueLabels,
  /** Name of a data-field (e.g. "city") whose value maps to the city palette. */
  cellColorKey,
}: {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  xKey: string;
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: string | number) => string;
  unit?: string;
  layout?: "horizontal" | "vertical";
  showLegend?: boolean;
  stacked?: boolean;
  valueLabels?: Record<string, string>;
  cellColorKey?: string;
}) {
  const { hidden, toggle, visible } = useHiddenSeries(series);
  const vertical = layout === "vertical";

  return (
    <div>
      {showLegend ? (
        <div className="mb-3">
          <SeriesLegend
            items={series.map(({ key, label, color }) => ({ key, label, color }))}
            hidden={hidden}
            onToggle={toggle}
          />
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 8, right: 12, bottom: 0, left: vertical ? 8 : 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={vertical} horizontal={!vertical} />
          {vertical ? (
            <>
              <XAxis type="number" {...AXIS_PROPS} axisLine={false} tickFormatter={yFormatter} tickMargin={4} />
              <YAxis type="category" dataKey={xKey} {...AXIS_PROPS} width={82} axisLine={false} tickMargin={2} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...AXIS_PROPS} tickFormatter={xFormatter} minTickGap={12} tickMargin={8} />
              <YAxis {...AXIS_PROPS} width={46} axisLine={false} tickFormatter={yFormatter} tickMargin={4} />
            </>
          )}
          <RechartsTooltip
            cursor={{ fill: "rgba(43,35,80,0.06)" }}
            content={
              <ChartTooltip
                formatter={(v) => `${v?.toFixed(1)}${unit ?? ""}`}
                labelFormatter={xFormatter}
                valueLabels={valueLabels ?? Object.fromEntries(series.map((s) => [s.key, s.label]))}
              />
            }
          />
          {visible.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={s.radius ?? (vertical ? [0, 4, 4, 0] : [4, 4, 0, 0])}
              barSize={s.barSize}
              isAnimationActive={false}
            >
              {cellColorKey
                ? data.map((entry, idx) => (
                    <Cell key={idx} fill={cityColor(String(entry[cellColorKey] ?? ""))} />
                  ))
                : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Combo: bars + line ----------

export function ComboChart({
  data,
  bars,
  lines,
  xKey,
  height = 320,
  yFormatter,
  xFormatter,
  unit,
  barUnit,
  showLegend = true,
  valueLabels,
}: {
  data: Record<string, unknown>[];
  bars: SeriesDef[];
  lines: SeriesDef[];
  xKey: string;
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: string | number) => string;
  unit?: string;
  barUnit?: string;
  showLegend?: boolean;
  valueLabels?: Record<string, string>;
}) {
  const allSeries = [...bars, ...lines];
  const { hidden, toggle, visible } = useHiddenSeries(allSeries);
  const visibleBars = visible.filter((s) => bars.some((b) => b.key === s.key));
  const visibleLines = visible.filter((s) => lines.some((l) => l.key === s.key));

  return (
    <div>
      {showLegend ? (
        <div className="mb-3">
          <SeriesLegend
            items={allSeries.map(({ key, label, color }) => ({ key, label, color }))}
            hidden={hidden}
            onToggle={toggle}
          />
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} tickFormatter={xFormatter} minTickGap={24} tickMargin={8} />
          <YAxis {...AXIS_PROPS} width={46} axisLine={false} tickFormatter={yFormatter} tickMargin={4} />
          <RechartsTooltip
            cursor={{ fill: "rgba(43,35,80,0.06)" }}
            content={
              <ChartTooltip
                formatter={(v, seriesKey) =>
                  `${v?.toFixed(1)}${bars.some((b) => b.key === seriesKey) ? (barUnit ?? unit ?? "") : (unit ?? "")}`
                }
                labelFormatter={xFormatter}
                valueLabels={valueLabels ?? Object.fromEntries(allSeries.map((s) => [s.key, s.label]))}
              />
            }
          />
          {visibleBars.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              barSize={s.barSize}
              isAnimationActive={false}
            />
          ))}
          {visibleLines.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Radar chart ----------

export function RadarSeriesChart({
  data,
  series,
  xKey,
  height = 320,
  unit,
  showLegend = true,
}: {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  xKey: string;
  height?: number;
  unit?: string;
  showLegend?: boolean;
}) {
  const { hidden, toggle, visible } = useHiddenSeries(series);
  return (
    <div>
      {showLegend ? (
        <div className="mb-1">
          <SeriesLegend
            items={series.map(({ key, label, color }) => ({ key, label, color }))}
            hidden={hidden}
            onToggle={toggle}
          />
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 8, left: 32 }}>
          <PolarGrid stroke="rgba(43,35,80,0.14)" />
          <PolarAngleAxis dataKey={xKey} tick={{ fill: CHART_AXIS, fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fill: CHART_AXIS, fontSize: 10 }} tickFormatter={(v) => `${v}`} axisLine={false} width={40} />
          <RechartsTooltip
            content={
              <ChartTooltip
                formatter={(v) => `${v?.toFixed(1)}${unit ?? ""}`}
                valueLabels={Object.fromEntries(series.map((s) => [s.key, s.label]))}
              />
            }
          />
          {visible.map((s) => (
            <Radar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.14}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- temperature color scale (for heatmap) ----------

const SCALE_STOPS = ["#EDE9F9", "#C9BFF2", "#6C4DE0", "#F0B429", "#E46A5A"];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function scaleColor(value: number, min: number, max: number): string {
  if (!Number.isFinite(value) || min === max) return SCALE_STOPS[0];
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const pos = t * (SCALE_STOPS.length - 1);
  const idx = Math.min(SCALE_STOPS.length - 2, Math.floor(pos));
  const localT = pos - idx;
  const a = hexToRgb(SCALE_STOPS[idx]);
  const b = hexToRgb(SCALE_STOPS[idx + 1]);
  return rgbToHex(lerp(a[0], b[0], localT), lerp(a[1], b[1], localT), lerp(a[2], b[2], localT));
}
