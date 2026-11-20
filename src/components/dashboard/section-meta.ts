import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CloudRain,
  Info,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Table2,
  Thermometer,
  Wind,
} from "lucide-react";
import type { SectionId } from "@/lib/store";

export interface SectionMeta {
  id: SectionId;
  label: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  group: "Dashboard" | "Analysis" | "Data";
}

export const SECTION_META: SectionMeta[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    title: "Pakistan Climate Overview",
    subtitle: "Historical Weather Intelligence Across Five Major Cities | 2024–2025",
    icon: LayoutDashboard,
    group: "Dashboard",
  },
  {
    id: "cities",
    label: "City Intelligence",
    shortLabel: "Cities",
    title: "City Intelligence",
    subtitle: "Per-city climate profiles, detailed analytics and side-by-side comparison",
    icon: MapPin,
    group: "Dashboard",
  },
  {
    id: "temperature",
    label: "Temperature Analysis",
    shortLabel: "Temperature",
    title: "Temperature Analysis",
    subtitle: "Daily maximum, minimum and mean temperature trends across the dataset",
    icon: Thermometer,
    group: "Analysis",
  },
  {
    id: "precipitation",
    label: "Precipitation Analysis",
    shortLabel: "Precipitation",
    title: "Precipitation Analysis",
    subtitle: "Rainfall totals, monthly patterns and inter-city precipitation ranking",
    icon: CloudRain,
    group: "Analysis",
  },
  {
    id: "wind",
    label: "Wind Analysis",
    shortLabel: "Wind",
    title: "Wind Analysis",
    subtitle: "Maximum wind speed and gust behaviour across cities and seasons",
    icon: Wind,
    group: "Analysis",
  },
  {
    id: "seasonal",
    label: "Seasonal Analysis",
    shortLabel: "Seasonal",
    title: "Seasonal Analysis",
    subtitle: "Meteorological season comparison with monthly temperature heatmap",
    icon: CalendarDays,
    group: "Analysis",
  },
  {
    id: "explorer",
    label: "Data Explorer",
    shortLabel: "Explorer",
    title: "Data Explorer",
    subtitle: "Search, filter, sort and export the full daily weather dataset",
    icon: Table2,
    group: "Data",
  },
  {
    id: "quality",
    label: "Data Quality",
    shortLabel: "Quality",
    title: "Data Quality",
    subtitle: "Completeness, duplicates, coverage and validation of the cleaned dataset",
    icon: ShieldCheck,
    group: "Data",
  },
  {
    id: "about",
    label: "About Project",
    shortLabel: "About",
    title: "About Project",
    subtitle: "Objective, data source, ETL pipeline and dataset limitations",
    icon: Info,
    group: "Data",
  },
];

export const SECTION_BY_ID = Object.fromEntries(
  SECTION_META.map((s) => [s.id, s])
) as Record<SectionId, SectionMeta>;

export const NAV_GROUPS: { label: string; items: SectionMeta[] }[] = ["Dashboard", "Analysis", "Data"].map(
  (group) => ({
    label: group,
    items: SECTION_META.filter((s) => s.group === group),
  })
);
