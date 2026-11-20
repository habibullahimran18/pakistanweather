# Pakistan WeatherWatch

Historical weather ETL + EDA project for Lahore, Karachi, Islamabad, Peshawar, and Quetta.

Period: 2024-01-01 through 2025-12-31. Source: Open-Meteo Historical Weather API (no API key required).

## Setup
```bash
pip install -r requirements.txt
```

## Run from the project root
```bash
python -m src.main
```

Pipeline stages:
1. Extract API responses into `data/raw/weather_raw.json`.
2. Transform them into `data/processed/weather_clean.csv`.
3. Load the clean data into `data/database/weather.db`.
4. Run EDA, exporting CSV reports and PNG charts under `reports/`.

You can also run a stage separately with `python -m src.extract`, `python -m src.transform`, `python -m src.load`, or `python -m src.eda`.

Missing values remain missing; they are not replaced with zero. Internet access is required for extraction.
