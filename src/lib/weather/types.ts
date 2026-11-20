/** Shared domain types for Pakistan WeatherWatch. */

export interface WeatherRecord {
  /** City name, e.g. "Lahore". */
  city: string;
  /** ISO date, e.g. "2024-01-01". */
  date: string;
  temperatureMax: number | null;
  temperatureMin: number | null;
  temperatureMean: number | null;
  precipitation: number | null;
  rain: number | null;
  windSpeedMax: number | null;
  windGustsMax: number | null;
  year: number;
  month: number;
  monthName: string;
  day: number;
}

export interface CityMeta {
  name: string;
  province: string;
  shortProvince: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  climate: string;
  /** Rough population (metro, millions) for context chips. */
  populationM: string;
}

export const CITIES_META: CityMeta[] = [
  {
    name: "Lahore",
    province: "Punjab",
    shortProvince: "PB",
    latitude: 31.5204,
    longitude: 74.3587,
    elevationM: 217,
    climate: "Humid subtropical",
    populationM: "13.5",
  },
  {
    name: "Karachi",
    province: "Sindh",
    shortProvince: "SD",
    latitude: 24.8607,
    longitude: 67.0011,
    elevationM: 9,
    climate: "Arid coastal",
    populationM: "20.3",
  },
  {
    name: "Islamabad",
    province: "Islamabad Capital Territory",
    shortProvince: "ICT",
    latitude: 33.6844,
    longitude: 73.0479,
    elevationM: 540,
    climate: "Subtropical highland",
    populationM: "1.2",
  },
  {
    name: "Peshawar",
    province: "Khyber Pakhtunkhwa",
    shortProvince: "KP",
    latitude: 34.0151,
    longitude: 71.5249,
    elevationM: 359,
    climate: "Semi-arid steppe",
    populationM: "2.3",
  },
  {
    name: "Quetta",
    province: "Balochistan",
    shortProvince: "BL",
    latitude: 30.1798,
    longitude: 66.975,
    elevationM: 1680,
    climate: "Cold arid highland",
    populationM: "1.0",
  },
];

export const CITY_NAMES = CITIES_META.map((c) => c.name);

export const WEATHER_PARAMETERS = [
  { key: "temperatureMax", label: "Maximum temperature", unit: "°C", apiField: "temperature_2m_max" },
  { key: "temperatureMin", label: "Minimum temperature", unit: "°C", apiField: "temperature_2m_min" },
  { key: "temperatureMean", label: "Mean temperature", unit: "°C", apiField: "temperature_2m_mean" },
  { key: "precipitation", label: "Total precipitation", unit: "mm", apiField: "precipitation_sum" },
  { key: "rain", label: "Total rain", unit: "mm", apiField: "rain_sum" },
  { key: "windSpeedMax", label: "Maximum wind speed", unit: "km/h", apiField: "wind_speed_10m_max" },
  { key: "windGustsMax", label: "Maximum wind gusts", unit: "km/h", apiField: "wind_gusts_10m_max" },
] as const;

export type SeasonName = "Winter" | "Spring" | "Summer" | "Autumn";

export const SEASONS: { name: SeasonName; months: number[]; window: string }[] = [
  { name: "Winter", months: [12, 1, 2], window: "Dec – Feb" },
  { name: "Spring", months: [3, 4, 5], window: "Mar – May" },
  { name: "Summer", months: [6, 7, 8], window: "Jun – Aug" },
  { name: "Autumn", months: [9, 10, 11], window: "Sep – Nov" },
];

export function seasonOfMonth(month: number): SeasonName {
  if (month === 12 || month === 1 || month === 2) return "Winter";
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  return "Autumn";
}
