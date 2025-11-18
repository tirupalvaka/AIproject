"use client";
import React from "react";

type Props = { value500: number; size?: number };

export default function ScoreDial({ value500, size = 160 }: Props) {
  const max = 500;
  const pct = Math.max(0, Math.min(1, value500 / max));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  let level = "Not Started";
  if (value500 >= 401) level = "Leading";
  else if (value500 >= 301) level = "Advanced";
  else if (value500 >= 201) level = "Developing";
  else if (value500 >= 101) level = "Initial";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          className="text-blue-600"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-slate-900"
          fontSize="28"
          fontWeight={700}
        >
          {value500}
        </text>
      </svg>
      <div className="mt-2 text-sm text-slate-600">out of 500 • {Math.round(pct * 100)}%</div>
      <div className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        {level}
      </div>
    </div>
  );
}

