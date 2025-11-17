"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchDigitalReadiness } from "@/lib/fetchDigitalReadiness";

type DigitalReadinessData = {
  score: number;      // raw 0–140
  max: number;        // 140
  percent: number;    // 0–100
  level: number;      // 1–5
  maturity: string;   // Not Started / Initial / ...
  timestamp: string;  // ISO
};

// Map level -> ring colour
function getRingColor(level: number): string {
  if (level <= 1) return "#ef4444";   // red-500
  if (level === 2) return "#f59e0b";  // amber-400
  if (level === 3) return "#a3e635";  // lime-400
  return "#22c55e";                   // emerald-500
}

export default function DigitalReadinessPage() {
  const searchParams = useSearchParams();
  const customer = searchParams.get("customer") ?? "Contoso";
  const participant = searchParams.get("participant") ?? "Alex Doe";

  const [data, setData] = useState<DigitalReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let firstLoad = true;

    async function loadOnce() {
      try {
        if (!cancelled && firstLoad) {
          setLoading(true);
          setError(null);
        }

        const res = await fetchDigitalReadiness(customer, participant);
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load Digital Readiness");
        }
      } finally {
        if (!cancelled && firstLoad) {
          setLoading(false);
          firstLoad = false;
        }
      }
    }

    // initial fetch
    loadOnce();

    // poll every 30 seconds for live updates
    intervalId = setInterval(loadOnce, 30_000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [customer, participant]);

  const score = data?.score ?? 0;
  const max = data?.max ?? 140;
  const pct = data?.percent ?? (max ? (score / max) * 100 : 0);
  const level = data?.level ?? 0;
  const maturity = data?.maturity ?? "";
  const lastUpdated = data?.timestamp
    ? new Date(data.timestamp).toLocaleString()
    : "--";

  const clamped = Math.max(0, Math.min(100, pct));
  const centreValue = Math.round(clamped);

  // Donut geometry
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * clamped) / 100;
  const ringColor = getRingColor(level);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">
          Digital Readiness
        </h1>

        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-8 flex flex-col md:flex-row gap-8">
          {/* Gauge card */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 mb-4">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                {/* Grey background track */}
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  strokeWidth="4"
                  stroke="#e5e7eb"   // slate-200
                  fill="none"
                />
                {/* Coloured arc */}
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  strokeWidth="4"
                  stroke={ringColor}
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                />
              </svg>

              {/* Centre text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-semibold text-slate-900">
                  {centreValue}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  0 <span className="mx-1">|</span> {max}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-center max-w-xs">
              Overall strategic alignment and digital readiness score.
            </p>
          </div>

          {/* Detail panel */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">
                  {customer}
                </span>{" "}
                — {participant}
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 tracking-wide">
                  PERCENTAGE
                </div>
                <div className="text-lg text-slate-900">
                  {pct.toFixed(2)} / 100
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 tracking-wide">
                  MATURITY LEVEL
                </div>
                <div className="text-lg text-slate-900">
                  Level {level || "—"} {maturity && <span>· {maturity}</span>}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 tracking-wide">
                  RAW SCORE
                </div>
                <div className="text-lg text-slate-900">
                  {score} / {max}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-xs text-slate-500">
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>

        {loading && (
          <p className="mt-4 text-xs text-slate-500">
            Loading latest score…
          </p>
        )}
        {error && (
          <p className="mt-4 text-xs text-red-500">Error: {error}</p>
        )}
        {!loading && !error && (
          <p className="mt-2 text-[10px] text-slate-400">
            Live: auto-refreshing every 30 seconds for {customer} / {participant}.
          </p>
        )}
      </div>
    </main>
  );
}

