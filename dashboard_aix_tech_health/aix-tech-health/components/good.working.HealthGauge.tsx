// components/HealthGauge.tsx
import { scoreToHealthLevel } from "@/lib/levels";

type Props = {
  score: number;           // 0..500
  max?: number;            // default 500
  title?: string;          // "Technical Health"
  subtitle?: string;       // "0 — 500"
};

export default function HealthGauge({ score, max = 500, title = "Technical Health", subtitle = "0 — 500" }: Props) {
  const clamped = Math.max(0, Math.min(max, score));
  const pct = clamped / max; // 0..1
  const lvl = scoreToHealthLevel(clamped);

  // Dial geometry
  const size = 156;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const gap = c - dash;

  return (
    <div className="p-4 border rounded-xl bg-white">
      <div className="text-base font-medium">{title}</div>
      <div className="mt-3 grid place-items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* track */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={stroke}
          />
          {/* progress */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            strokeLinecap="round"
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            stroke={`currentColor`}
            className={lvl.color.replace("bg-", "text-")}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
          {/* numbers */}
          <g textAnchor="middle">
            <text x="50%" y="50%" dy="0.35em" className="fill-slate-900 text-3xl font-bold">
              {clamped}
            </text>
            <text x="50%" y="65%" className="fill-slate-500 text-sm">
              {subtitle}
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-3">
        <LevelBadgeInline score500={clamped} />
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {lvl.profile}
      </p>
    </div>
  );
}

// Small inline badge used inside the gauge card
function LevelBadgeInline({ score500 }: { score500: number }) {
  const lvl = scoreToHealthLevel(score500);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs text-white ${lvl.color}`}>
      {lvl.label} — {lvl.name}
    </span>
  );
}

