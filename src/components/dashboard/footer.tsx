export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/70">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-1.5 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[11px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <span className="font-medium text-secondary-foreground">Pakistan WeatherWatch</span> — Historical
          Weather Intelligence · 2024–2025 · Lahore, Karachi, Islamabad, Peshawar, Quetta
        </div>
        <div className="flex items-center gap-1.5">
          Data: Open-Meteo Historical Weather API · Built with Next.js, TypeScript &amp; Recharts
        </div>
      </div>
    </footer>
  );
}
