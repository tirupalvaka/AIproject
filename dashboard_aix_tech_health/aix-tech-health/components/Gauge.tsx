// components/Gauge.tsx
type Props = {
  score: number;
};

export function Gauge({ score }: Props) {
  const pct = Math.min(Math.max(score / 500, 0), 1);

  // map score → color
  const levelColor =
    score >= 401 ? "#0F9D58" :   // Green
    score >= 301 ? "#F4B400" :   // Yellow
    score >= 201 ? "#FB8C00" :   // Orange
    score >= 101 ? "#DB4437" :   // Red
    "#757575";                  // Gray

  return (
    <svg width="180" height="180" viewBox="0 0 42 42">
      <circle
        cx="21" cy="21" r="15.915"
        fill="transparent"
        stroke="#e6e6e6"
        strokeWidth="3"
      />
      <circle
        cx="21" cy="21" r="15.915"
        fill="transparent"
        stroke={levelColor}             // <— APPLY COLOR
        strokeWidth="3"
        strokeDasharray={`${pct * 100} ${100 - pct * 100}`}
        strokeLinecap="round"
        transform="rotate(-90 21 21)"
      />
      <text x="21" y="21" textAnchor="middle" dy=".3em" fontSize="5">
        {score}
      </text>
      <text x="21" y="27" textAnchor="middle" fontSize="3">
        0 — 500
      </text>
    </svg>
  );
}

