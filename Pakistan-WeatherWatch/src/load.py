import sqlite3
import os
import pandas as pd

INPUT_PATH = "data/processed/weather_clean.csv"
DATABASE_PATH = "data/database/weather.db"
TABLE_NAME = "daily_weather"

weather_df = pd.read_csv(INPUT_PATH)
weather_df["date"] = pd.to_datetime(weather_df["date"])

os.makedirs("data/database", exist_ok=True)
connection = sqlite3.connect(DATABASE_PATH)

weather_df.to_sql(
    TABLE_NAME,
    connection,
    if_exists="replace",
    index=False
)

cursor = connection.cursor()
cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
total_records = cursor.fetchone()[0]

cursor.execute(f"SELECT COUNT(DISTINCT city) FROM {TABLE_NAME}")
total_cities = cursor.fetchone()[0]

connection.close()

print("\n---------- DATA LOADING COMPLETED ----------")
print(f"Records loaded: {total_records}")
print(f"Cities loaded: {total_cities}")
print(f"Database saved to: {DATABASE_PATH}")
