"use client";

import { scoreToLevel, levelToColor } from "@/lib/score_to_level";

interface Props {
  total: number; // 0..105
}

export default function AIGauge({ total }: Props) {
  const max = 105;
  const pct = Math.max(0, Math.min(total / max, 1));

  const { level, maturity } = scoreToLevel(total);
  const color = levelToColor(level);

  const r = 80;
  const cx = 100;
  const cy = 100;
  const arcLen = Math.PI * r;
  const filled = arcLen * pct;

  return (
    <div className="flex flex-col items-center bg-white rounded-xl shadow p-4 w-[260px]">
      <h2 className="text-sm font-semibold mb-2 text-gray-800">
        AI Readiness
      </h2>
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* filled arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeDasharray={`${filled} ${arcLen}`}
          strokeLinecap="round"
        />
        {/* total in center */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill="#111827"
        >
          {total}
        </text>
        {/* 0 & 105 labels */}
        <text x="30" y="110" fontSize="12" fill="#6B7280">
          0
        </text>
        <text x="165" y="110" fontSize="12" fill="#6B7280">
          105
        </text>
      </svg>
      <div className="mt-2 text-xs text-gray-700">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-white text-xs font-medium"
          style={{ backgroundColor: color }}
        >
          Level {level} · {maturity}
        </span>
      </div>
    </div>
  );
}

