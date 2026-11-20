"use client";

/**
 * Stylized Pakistan map with the five monitored city markers.
 * Geometry is generated from Natural Earth data (see scripts/generate-map.mjs);
 * city positions use the same equirectangular projection.
 */

import { useMemo, useState } from "react";
import { PAKISTAN_CITIES, PAKISTAN_PATH, PAKISTAN_VIEWBOX } from "@/lib/weather/pakistan-map";
import { CITIES_META } from "@/lib/weather/types";
import { cityColor } from "@/lib/weather/format";
import type { CityStat } from "@/lib/weather/api-types";

interface HoverInfo {
  city: string;
  xPct: number;
  yPct: number;
}

export function PakistanMap({
  cityStats,
  onSelectCity,
  height = 440,
  valueForLabel,
}: {
  cityStats: Record<string, CityStat> | null;
  onSelectCity: (city: string) => void;
  height?: number;
  /** Optional metric shown on hover for each city, keyed by city name. */
  valueForLabel?: (stat: CityStat) => string;
}) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const cities = useMemo(
    () =>
      CITIES_META.map((meta) => ({
        ...meta,
        pos: PAKISTAN_CITIES[meta.name],
        color: cityColor(meta.name),
      })).filter((c) => Boolean(c.pos)),
    []
  );

  return (
    <figure
      className="relative w-full select-none"
      style={{ height }}
      aria-label="Stylized map of Pakistan with the five monitored cities: Lahore, Karachi, Islamabad, Peshawar and Quetta"
    >
      <svg
        viewBox={`0 0 ${PAKISTAN_VIEWBOX.width} ${PAKISTAN_VIEWBOX.height}`}
        className="h-full w-full"
        role="img"
        aria-hidden="false"
      >
        <defs>
          <linearGradient id="pk-land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E7E1F6" />
            <stop offset="55%" stopColor="#DCD5F0" />
            <stop offset="100%" stopColor="#D0C8EC" />
          </linearGradient>
          <pattern id="pk-dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="rgba(124,92,224,0.14)" />
          </pattern>
          <clipPath id="pk-clip">
            <path d={PAKISTAN_PATH} />
          </clipPath>
        </defs>

        {/* soft backdrop */}
        <rect x="0" y="0" width={PAKISTAN_VIEWBOX.width} height={PAKISTAN_VIEWBOX.height} fill="transparent" />

        {/* landmass */}
        <path d={PAKISTAN_PATH} fill="url(#pk-land)" stroke="rgba(124,92,224,0.40)" strokeWidth="2" strokeLinejoin="round" />
        <path d={PAKISTAN_PATH} fill="url(#pk-dots)" clipPath="url(#pk-clip)" opacity="0.9" />

        {/* city markers */}
        {cities.map((city) => {
          const stat = cityStats?.[city.name];
          const label = stat && valueForLabel ? valueForLabel(stat) : null;
          return (
            <g
              key={city.name}
              role="button"
              tabIndex={0}
              aria-label={`${city.name}, ${city.province}. View detailed analytics.`}
              className="cursor-pointer outline-none focus-visible:opacity-80"
              onMouseEnter={() => setHover({ city: city.name, xPct: (city.pos.x / PAKISTAN_VIEWBOX.width) * 100, yPct: (city.pos.y / PAKISTAN_VIEWBOX.height) * 100 })}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectCity(city.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCity(city.name);
                }
              }}
            >
              {/* pulse ring */}
              <circle cx={city.pos.x} cy={city.pos.y} r="9" fill={city.color} opacity="0.35" className="ww-pulse-ring" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              <circle cx={city.pos.x} cy={city.pos.y} r="8.5" fill="none" stroke={city.color} strokeWidth="1.5" opacity="0.55" />
              <circle cx={city.pos.x} cy={city.pos.y} r="4.5" fill={city.color} stroke="#FFFFFF" strokeWidth="1.6" />
              <text
                x={city.pos.x + 11}
                y={city.pos.y + 5}
                fontSize="30"
                fontWeight="600"
                fill="#2B2350"
                opacity="0.92"
                style={{ letterSpacing: "0.5px" }}
              >
                {city.name}
                {label ? (
                  <tspan fill="#6B6787" fontSize="26" fontWeight="500">
                    {"  "}
                    {label}
                  </tspan>
                ) : null}
              </text>
            </g>
          );
        })}
      </svg>

      {/* hover card */}
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 w-44 rounded-lg border border-violet/15 bg-popover/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: `min(max(${hover.xPct}%, 8px), calc(100% - 190px))`,
            top: `min(max(${hover.yPct - 4}%, 8px), calc(100% - 110px))`,
          }}
          role="status"
        >
          {(() => {
            const meta = cities.find((c) => c.name === hover.city)!;
            const stat = cityStats?.[hover.city];
            return (
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
                  <span className="text-sm font-semibold text-foreground">{meta.name}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{meta.province}</div>
                {stat ? (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Avg temp</span>
                      <span className="tabular font-medium text-foreground">{stat.avgTempMean !== null ? `${stat.avgTempMean.toFixed(1)}°C` : "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Precipitation</span>
                      <span className="tabular font-medium text-foreground">{stat.totalPrecipitation !== null ? `${stat.totalPrecipitation.toFixed(0)} mm` : "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Max gust</span>
                      <span className="tabular font-medium text-foreground">{stat.maxWindGust !== null ? `${stat.maxWindGust.toFixed(0)} km/h` : "—"}</span>
                    </div>
                  </div>
                ) : null}
                <div className="mt-2 border-t border-violet/15 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-lav">
                  Click for analytics →
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}
    </figure>
  );
}
