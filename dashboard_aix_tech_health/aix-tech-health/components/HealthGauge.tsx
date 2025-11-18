// components/HealthGauge.tsx
import React from "react";

type Props = {
  score: number;
  max?: number;
  className?: string;
};

function colorFor(score: number) {
  if (score >= 401) return { hex: "#16a34a" }; // green 600 (Leading)
  if (score >= 301) return { hex: "#ca8a04" }; // yellow 600 (Advanced)
  if (score >= 201) return { hex: "#ea580c" }; // orange 600 (Developing)
  if (score >= 101) return { hex: "#dc2626" }; // red 600 (Initial)
  return { hex: "#6b7280" };                 // gray 500 (Not started)
}

export default function HealthGauge({ score, max = 500, className = "" }: Props) {
  const clamped = Math.max(0, Math.min(score, max));
  const pct = clamped / max;

  // SVG circle geometry
  const size = 260;             // px
  const stroke = 24;            // arc thickness
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  // Start at 12 o’clock
  const dashArray = c.toFixed(3);
  const dashOffset = (c * (1 - pct)).toFixed(3);

  const { hex } = colorFor(score);

  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }} // 0% at top
      >
        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"               // slate-200
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 600ms ease, stroke 200ms ease" }}
        />
      </svg>

      {/* center labels (not rotated) */}
      <div
        style={{
          position: "absolute",
          textAlign: "center",
          lineHeight: 1.15,
          color: hex,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600 }}>{clamped}</div>
        <div style={{ fontSize: 16, color: "#374151" /* slate-700 */ }}>0 — {max}</div>
      </div>
    </div>
  );
}

