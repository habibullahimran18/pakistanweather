import sqlite3
import os
import pandas as pd
import matplotlib.pyplot as plt

DATABASE_PATH = "data/database/weather.db"
REPORT_PATH = "reports"
CHART_PATH = "reports/charts"

os.makedirs(REPORT_PATH, exist_ok=True)
os.makedirs(CHART_PATH, exist_ok=True)

connection = sqlite3.connect(DATABASE_PATH)
weather_df = pd.read_sql_query("SELECT * FROM daily_weather", connection)
connection.close()

weather_df["date"] = pd.to_datetime(weather_df["date"])

print("\n---------- DATA OVERVIEW ----------")
print(f"Total records: {len(weather_df)}")
print(f"Total cities: {weather_df['city'].nunique()}")
print(f"Date range: {weather_df['date'].min()} to {weather_df['date'].max()}")
print("\nRecords per city:")
print(weather_df["city"].value_counts())

numeric_columns = [
    "temperature_max", "temperature_min", "temperature_mean",
    "precipitation", "rain", "wind_speed_max", "wind_gusts_max"
]

statistics = weather_df.groupby("city")[numeric_columns].agg(
    ["mean", "median", "min", "max"]
)

print("\n---------- DESCRIPTIVE STATISTICS ----------")
print(statistics.round(2))
statistics.to_csv(f"{REPORT_PATH}/city_weather_statistics.csv")

temperature_analysis = weather_df.groupby("city")[
    ["temperature_max", "temperature_min", "temperature_mean"]
].mean().round(2)

print("\n---------- AVERAGE TEMPERATURE BY CITY ----------")
print(temperature_analysis)
temperature_analysis.to_csv(f"{REPORT_PATH}/average_temperature_by_city.csv")

temperature_analysis.plot(kind="bar", figsize=(10, 6))
plt.title("Average Temperature by City (2024-2025)")
plt.xlabel("City")
plt.ylabel("Temperature (°C)")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig(f"{CHART_PATH}/average_temperature_by_city.png")
plt.close()

monthly_temperature = weather_df.groupby(
    ["city", "year", "month"]
)["temperature_mean"].mean().reset_index()

monthly_temperature["month_date"] = pd.to_datetime(
    monthly_temperature["year"].astype(str) + "-" +
    monthly_temperature["month"].astype(str) + "-01"
)

plt.figure(figsize=(12, 6))

for city in weather_df["city"].unique():
    city_data = monthly_temperature[monthly_temperature["city"] == city]
    plt.plot(
        city_data["month_date"],
        city_data["temperature_mean"],
        label=city
    )

plt.title("Monthly Average Temperature Trends (2024-2025)")
plt.xlabel("Month")
plt.ylabel("Temperature (°C)")
plt.legend()
plt.tight_layout()
plt.savefig(f"{CHART_PATH}/monthly_temperature_trends.png")
plt.close()

precipitation_analysis = weather_df.groupby("city")[
    "precipitation"
].sum().sort_values(ascending=False)

print("\n---------- TOTAL PRECIPITATION BY CITY ----------")
print(precipitation_analysis.round(2))
precipitation_analysis.to_csv(f"{REPORT_PATH}/total_precipitation_by_city.csv")

precipitation_analysis.plot(kind="bar", figsize=(10, 6))
plt.title("Total Precipitation by City (2024-2025)")
plt.xlabel("City")
plt.ylabel("Precipitation (mm)")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig(f"{CHART_PATH}/total_precipitation_by_city.png")
plt.close()

wind_analysis = weather_df.groupby("city")[
    "wind_speed_max"
].mean().sort_values(ascending=False)

print("\n---------- AVERAGE MAXIMUM WIND SPEED BY CITY ----------")
print(wind_analysis.round(2))
wind_analysis.to_csv(f"{REPORT_PATH}/average_wind_speed_by_city.csv")

wind_analysis.plot(kind="bar", figsize=(10, 6))
plt.title("Average Daily Maximum Wind Speed by City (2024-2025)")
plt.xlabel("City")
plt.ylabel("Wind Speed (km/h)")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig(f"{CHART_PATH}/average_wind_speed_by_city.png")
plt.close()

print("\n---------- DATA QUALITY CHECKS ----------")
print("\nMissing values:")
print(weather_df.isnull().sum())

print("\nDuplicate records:")
print(weather_df.duplicated(subset=["city", "date"]).sum())

invalid_temperature = weather_df[
    weather_df["temperature_min"] > weather_df["temperature_max"]
]

print("\nInvalid temperature records:")
print(len(invalid_temperature))

quality_report = pd.DataFrame({
    "column": weather_df.columns,
    "missing_values": [
        weather_df[column].isnull().sum()
        for column in weather_df.columns
    ]
})

quality_report.to_csv(f"{REPORT_PATH}/data_quality_report.csv", index=False)

print("\n---------- EDA COMPLETED ----------")
print(f"Reports saved in: {REPORT_PATH}")
print(f"Charts saved in: {CHART_PATH}")
