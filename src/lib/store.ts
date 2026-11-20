"use client";

import { create } from "zustand";

export type SectionId =
  | "overview"
  | "cities"
  | "temperature"
  | "precipitation"
  | "wind"
  | "seasonal"
  | "explorer"
  | "quality"
  | "about";

export const SECTION_IDS: SectionId[] = [
  "overview",
  "cities",
  "temperature",
  "precipitation",
  "wind",
  "seasonal",
  "explorer",
  "quality",
  "about",
];

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as string[]).includes(value);
}

interface DashboardState {
  section: SectionId;
  cityFilter: string; // "all" | city name
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  activeCity: string | null;
  setSection: (section: SectionId) => void;
  setCityFilter: (city: string) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  openCity: (city: string) => void;
  closeCity: () => void;
}

export const useDashboard = create<DashboardState>((set) => ({
  section: "overview",
  cityFilter: "all",
  sidebarCollapsed: false,
  mobileNavOpen: false,
  activeCity: null,
  setSection: (section) => set({ section, mobileNavOpen: false }),
  setCityFilter: (cityFilter) => set({ cityFilter }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  openCity: (activeCity) => set({ activeCity, section: "cities", mobileNavOpen: false }),
  closeCity: () => set({ activeCity: null }),
}));
