/**
 * Warna grafik dikirim sebagai heks dari service dashboard. Di sini dipetakan ke
 * variabel CSS tema agar ikut berganti di mode gelap.
 */
const CHART_COLOR_VARS: Record<string, string> = {
  "#0101B7": "var(--chart-primary)",
  "#7E9BF7": "var(--chart-primary-soft)",
  "#FFD166": "var(--chart-accent)",
  "#E3E8F2": "var(--track)",
};

export function chartColor(color: string): string {
  return CHART_COLOR_VARS[color.toUpperCase()] ?? color;
}
