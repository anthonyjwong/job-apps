"use client";
import React from "react";

export type PieDatum = {
  label: string;
  value: number;
  color?: string;
};

type PieChartProps = {
  data: PieDatum[];
  size?: number; // total width/height in px
  thickness?: number; // ring thickness in px (donut)
  dark?: boolean;
  ariaLabel?: string;
};

const paletteLight = [
  "#2563eb", // blue-600
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#e11d48", // rose-600
];

const paletteDark = [
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#a78bfa", // violet-400
  "#2dd4bf", // teal-400
  "#fb923c", // orange-400
  "#4ade80", // green-400
  "#93c5fd", // blue-300
  "#fb7185", // rose-400
];

export default function PieChart({ data, size = 240, thickness = 24, dark = false, ariaLabel = "Pie chart" }: PieChartProps) {
  const total = data.reduce((acc, d) => acc + (isFinite(d.value) ? d.value : 0), 0);
  if (!isFinite(total) || total <= 0) {
    return <div aria-label={ariaLabel}>No data</div>;
  }

  const palette = dark ? paletteDark : paletteLight;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      <title>{ariaLabel}</title>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = circumference * fraction;
          const gap = circumference - dash;
          const offset = circumference * (1 - cumulative);
          const color = d.color || palette[i % palette.length];

          cumulative += fraction;

          return (
            <circle
              key={`${d.label}-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          );
        })}
      </g>
    </svg>
  );
}
