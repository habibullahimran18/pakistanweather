import json
import os
import pandas as pd

INPUT_PATH = "data/raw/weather_raw.json"
OUTPUT_PATH = "data/processed/weather_clean.csv"

with open(INPUT_PATH, "r", encoding="utf-8") as file:
    raw_data = json.load(file)

weather_records = []

for city, city_data in raw_data["cities"].items():

    daily_data = city_data["daily"]

    for index, date in enumerate(daily_data["time"]):

        record = {
            "city": city,
            "date": date,
            "temperature_max": daily_data["temperature_2m_max"][index],
            "temperature_min": daily_data["temperature_2m_min"][index],
            "temperature_mean": daily_data["temperature_2m_mean"][index],
            "precipitation": daily_data["precipitation_sum"][index],
            "rain": daily_data["rain_sum"][index],
            "wind_speed_max": daily_data["wind_speed_10m_max"][index],
            "wind_gusts_max": daily_data["wind_gusts_10m_max"][index]
        }

        weather_records.append(record)

weather_df = pd.DataFrame(weather_records)
weather_df["date"] = pd.to_datetime(weather_df["date"])

numeric_columns = [
    "temperature_max", "temperature_min", "temperature_mean",
    "precipitation", "rain", "wind_speed_max", "wind_gusts_max"
]

for column in numeric_columns:
    weather_df[column] = pd.to_numeric(weather_df[column], errors="coerce")

weather_df = weather_df.drop_duplicates(subset=["city", "date"])
weather_df = weather_df.sort_values(
    by=["city", "date"]
).reset_index(drop=True)

weather_df["year"] = weather_df["date"].dt.year
weather_df["month"] = weather_df["date"].dt.month
weather_df["month_name"] = weather_df["date"].dt.month_name()
weather_df["day"] = weather_df["date"].dt.day

os.makedirs("data/processed", exist_ok=True)
weather_df.to_csv(OUTPUT_PATH, index=False, date_format="%Y-%m-%d")

print("\n---------- TRANSFORMATION COMPLETED ----------")
print(f"Total records: {len(weather_df)}")
print(f"Cities: {weather_df['city'].nunique()}")
print(f"Missing values: {weather_df.isnull().sum().sum()}")
print(f"Clean data saved to: {OUTPUT_PATH}")
