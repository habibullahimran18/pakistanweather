import requests
import json
import os
from datetime import datetime

URL = "https://archive-api.open-meteo.com/v1/archive"
START_DATE = "2024-01-01"
END_DATE = "2025-12-31"

CITIES = {
    "Lahore": {"latitude": 31.5204, "longitude": 74.3587},
    "Karachi": {"latitude": 24.8607, "longitude": 67.0011},
    "Islamabad": {"latitude": 33.6844, "longitude": 73.0479},
    "Peshawar": {"latitude": 34.0151, "longitude": 71.5249},
    "Quetta": {"latitude": 30.1798, "longitude": 66.9750}
}

OUTPUT_PATH = "data/raw/weather_raw.json"

weather_data = {}

for city, coordinates in CITIES.items():

    print(f"Extracting weather data for {city}...")

    params = {
        "latitude": coordinates["latitude"],
        "longitude": coordinates["longitude"],
        "start_date": START_DATE,
        "end_date": END_DATE,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "precipitation_sum",
            "rain_sum",
            "wind_speed_10m_max",
            "wind_gusts_10m_max"
        ],
        "timezone": "Asia/Karachi"
    }

    try:
        response = requests.get(URL, params=params, timeout=60)
        response.raise_for_status()
        city_data = response.json()

        if "daily" not in city_data or "time" not in city_data["daily"]:
            raise ValueError(f"Daily weather data is missing for {city}")

        weather_data[city] = city_data
        print(f"{city} data extracted successfully.")

    except (requests.RequestException, ValueError) as error:
        print(f"Could not extract {city}: {error}")
        raise


os.makedirs("data/raw", exist_ok=True)

raw_data = {
    "extracted_at": datetime.now().isoformat(),
    "start_date": START_DATE,
    "end_date": END_DATE,
    "cities": weather_data
}

with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
    json.dump(raw_data, file, indent=4)

print("\n---------- EXTRACTION COMPLETED ----------")
print(f"Cities extracted: {len(weather_data)}")
print(f"Raw data saved to: {OUTPUT_PATH}")
