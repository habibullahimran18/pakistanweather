/** WeatherWatch brand mark + wordmark. */
export function WeatherWatchMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden focusable="false">
      <rect x="1.5" y="1.5" width="45" height="45" rx="12" stroke="rgba(180,156,255,0.35)" strokeWidth="1.5" />
      <rect x="1.5" y="1.5" width="45" height="45" rx="12" fill="url(#ww-g)" fillOpacity="0.28" />
      <defs>
        <linearGradient id="ww-g" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B7CF6" />
          <stop offset="1" stopColor="#1B183F" />
        </linearGradient>
      </defs>
      {/* radar arcs */}
      <path d="M13 30a11 11 0 0 1 22 0" stroke="#B49CFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 30a6.5 6.5 0 0 1 13 0" stroke="rgba(180,156,255,0.45)" strokeWidth="2" strokeLinecap="round" />
      {/* baseline */}
      <path d="M11 30h26" stroke="rgba(242,240,251,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      {/* sun */}
      <circle cx="31" cy="15.5" r="4.2" fill="#F0B429" />
      <path d="M31 8.6v1.7M31 20.7v1.7M37.9 15.5h-1.7M25.8 15.5h-1.7M36.1 10.4l-1.2 1.2M27.1 19.4l-1.2 1.2M36.1 20.6l-1.2-1.2M27.1 11.6l-1.2-1.2" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" />
      {/* sweep dot */}
      <circle cx="15.8" cy="30" r="2" fill="#FFFFFF" />
    </svg>
  );
}

export function WeatherWatchWordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <WeatherWatchMark className="h-9 w-9 shrink-0" />
      {collapsed ? null : (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-semibold tracking-wide text-white">
            Pakistan <span className="text-white/85">WeatherWatch</span>
          </div>
          <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
            Climate Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
