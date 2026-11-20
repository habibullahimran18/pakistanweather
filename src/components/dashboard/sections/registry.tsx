"use client";

import type { SectionId } from "@/lib/store";
import SectionOverview from "./section-overview";
import SectionCities from "./section-cities";
import SectionTemperature from "./section-temperature";
import SectionPrecipitation from "./section-precipitation";
import SectionWind from "./section-wind";
import SectionSeasonal from "./section-seasonal";
import SectionExplorer from "./section-explorer";
import SectionQuality from "./section-quality";

export const SECTION_COMPONENTS: Record<SectionId, () => React.ReactElement> = {
  overview: SectionOverview,
  cities: SectionCities,
  temperature: SectionTemperature,
  precipitation: SectionPrecipitation,
  wind: SectionWind,
  seasonal: SectionSeasonal,
  explorer: SectionExplorer,
  quality: SectionQuality,
  about: SectionQuality,
};
