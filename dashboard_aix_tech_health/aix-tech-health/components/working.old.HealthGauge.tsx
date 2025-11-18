// components/HealthGauge.tsx
type Props = {
  score: number;         // e.g., 184
  max?: number;          // default 500
  label?: string;        // "Technical Health"
  caption?: string;      // small gray helper text
  accent?: "green" | "yellow" | "orange" | "red"; // ring color
};

export default function HealthGauge({
  score,
  max = 500,
  label = "Technical Health",
  caption = "Score indicates level of code complexity and rework needed.",
  accent = "yellow",
}: Props) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));

  // Ring geometry
  const size = 148;             // SVG viewport
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  const ringColor =
    accent === "green" ? "#52A447" :
    accent === "yellow" ? "#D4A307" :
    accent === "orange" ? "#EA8A1A" :
    "#D33C3C";

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-slate-700">{label}</div>

      <div className="mt-4 flex items-center gap-6">
        {/* Gauge */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"                   // slate-200
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* Center number */}
          <text
            x="50%" y="50%"
            dominantBaseline="middle" textAnchor="middle"
            className="fill-slate-900"
            style={{ fontSize: 34, fontWeight: 600 }}
          >
            {Math.round(score)}
          </text>
          {/* 0 / 500 beneath */}
          <text
            x="50%" y="62%"
            dominantBaseline="middle" textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            0  |  {max}
          </text>
        </svg>

        {/* Right side copy + button */}
        <div className="flex flex-col">
          <p className="max-w-xs text-sm leading-5 text-slate-600">
            {caption}
          </p>

          <div className="mt-4">
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={() => {/* wire to assessment route later */}}
            >
              Update Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

