"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutSlice[];
  centerValue: string | number;
  centerLabel: string;
  size?: number;
}

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 170,
}: DonutChartProps) {
  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="68%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-heading text-h5 font-bold text-ink leading-none">
          {centerValue}
        </span>
        <span className="mt-1 text-body-sm text-ink-muted">{centerLabel}</span>
      </div>
    </div>
  );
}
