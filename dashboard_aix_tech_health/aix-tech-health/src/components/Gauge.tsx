"use client";
import React from "react";

type Props = { value: number; max?: number; size?: number };

export default function Gauge({ value, max = 500, size = 180 }: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="#e5e7eb" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          style={{ color: "#111827" }}
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-semibold">{Math.round(value)}</div>
          <div className="text-sm text-gray-500">/ {max}</div>
        </div>
      </div>
    </div>
  );
}

