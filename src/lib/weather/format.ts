/** Shared display formatting + palette constants (client & server safe). */

/** Fixed city identity colors — consistent across ALL charts and pages. */
export const CITY_COLORS: Record<string, string> = {
  Lahore: "#7C5CE0", // Violet — hero
  Karachi: "#5340B8", // Deep violet — coastal
  Islamabad: "#2FA98C", // Soft teal — capital
  Peshawar: "#E8A33D", // Amber — hot summers
  Quetta: "#D97E4A", // Terracotta — dry highland
};

export const ALL_CITIES_COLOR = "#6C4DE0";

export const cityColor = (city: string): string =>
  CITY_COLORS[city] ?? ALL_CITIES_COLOR;

/** Metric-family ramps: temperature = warm, precipitation = violet, wind = greys + lavender. */
export const METRIC_COLORS = {
  tempMax: "#E8A33D",
  tempMean: "#D97E4A",
  tempMin: "#8B7CF6",
  precipitation: "#6C4DE0",
  precipitationDeep: "#5340B8",
  rain: "#8B7CF6",
  wind: "#8B86A6",
  windHighlight: "#2B2350",
  gusts: "#8B7CF6",
} as const;

export const CHART_GRID = "rgba(43,35,80,0.10)";
export const CHART_AXIS = "#8B86A6";

// ---------- formatters ----------

const nf1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function fmtTemp(value: number | null | undefined, withUnit = true): string {
  if (value === null || value === undefined) return "—";
  return `${nf1.format(value)}${withUnit ? "°C" : ""}`;
}

export function fmtMm(value: number | null | undefined, withUnit = true): string {
  if (value === null || value === undefined) return "—";
  return `${nf1.format(value)}${withUnit ? " mm" : ""}`;
}

export function fmtKmh(value: number | null | undefined, withUnit = true): string {
  if (value === null || value === undefined) return "—";
  return `${nf1.format(value)}${withUnit ? " km/h" : ""}`;
}

export function fmtInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return nf0.format(value);
}

export function fmtNum(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${fmtNum(value, 1)}%`;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-03-05" -> "Mar 5, 2024" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return iso;
  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`;
}

/** "2024-03-05" -> "5 Mar 2024" (compact variant) */
export function fmtDateCompact(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** Dataset period label: "Jan 1, 2024 – Dec 31, 2025" */
export function fmtDateRange(start: string, end: string): string {
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export function fmtTempDelta(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${nf1.format(value)}°C`;
}
