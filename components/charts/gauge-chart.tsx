"use client";

export interface GaugeChartProps {
  percentage: number;
  subtitle?: string;
}

export function GaugeChart({ percentage, subtitle }: GaugeChartProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-32 w-52 flex items-end justify-center overflow-hidden">
        <svg
          width="208"
          height="118"
          viewBox="0 0 208 118"
          fill="none"
          aria-label={`Capaian ${clamped}%`}
        >
          <path
            d="M 24 104 A 80 80 0 0 1 184 104"
            stroke="#E3E8F2"
            strokeWidth="22"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 24 104 A 80 80 0 0 1 184 104"
            stroke="#0101B7"
            strokeWidth="22"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute bottom-1 flex flex-col items-center text-center">
          <span className="font-heading text-h4 font-bold text-ink leading-none">
            {clamped}%
          </span>
          {subtitle && (
            <span className="mt-1 text-body-sm text-ink-muted">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
