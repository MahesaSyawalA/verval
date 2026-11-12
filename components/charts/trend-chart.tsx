"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendDataPoint {
  label: string;
  capaian: number;
  target: number;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}

export function TrendChart({ data, height = 220 }: TrendChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="capaianFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.14} />
              <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border-soft)",
              borderRadius: 12,
              color: "var(--ink)",
            }}
            labelStyle={{ color: "var(--ink)" }}
          />
          <Area
            type="monotone"
            dataKey="capaian"
            name="Capaian"
            stroke="var(--chart-primary)"
            strokeWidth={3}
            fill="url(#capaianFill)"
          />
          <Area
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="var(--chart-accent)"
            strokeWidth={2.5}
            fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
