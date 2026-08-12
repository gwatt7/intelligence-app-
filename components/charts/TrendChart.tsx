"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface TrendPoint {
  label: string;
  value: number | null;
}

export function TrendChart({
  data,
  unit = "",
  color = "#3aa8ff",
  height = 220,
}: {
  data: TrendPoint[];
  unit?: string;
  color?: string;
  height?: number;
}) {
  if (data.every((d) => d.value === null)) {
    return <p className="text-sm text-muted py-8 text-center">Not enough data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232c3a" vertical={false} />
        <XAxis dataKey="label" stroke="#5c6b80" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#5c6b80" fontSize={12} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: "#161d29", border: "1px solid #232c3a", borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: "#8b98a9" }}
          formatter={(value) => [`${Number(value).toFixed(1)}${unit}`, ""]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
