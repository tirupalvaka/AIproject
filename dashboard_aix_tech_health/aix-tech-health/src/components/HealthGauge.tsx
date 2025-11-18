"use client";
type Props = { score500: number };

export default function HealthGauge({ score500 }: Props) {
  const pct = Math.max(0, Math.min(1, score500 / 500));
  const radius = 80;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 120" className="w-80 h-48">
        <g transform="translate(100,100)">
          <path d="M-90 0 A90 90 0 1 1 90 0" fill="none" stroke="#E5E7EB" strokeWidth="16" />
          <g transform="rotate(-180)">
            <circle
              r={radius}
              cx="0"
              cy="0"
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeDasharray={`${dash} ${circ}`}
              className="text-indigo-600"
              pathLength={circ}
            />
          </g>
        </g>
      </svg>
      <div className="text-center">
        <div className="text-4xl font-semibold">{score500}</div>
        <div className="text-sm text-gray-500">Technical Health (out of 500)</div>
      </div>
    </div>
  );
}
