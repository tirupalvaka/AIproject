// src/components/DigitalReadinessCard.tsx
"use client";

import React from "react";
import type { DigitalReadinessLatest } from "@/lib/fetchDigitalReadiness";

type Props = {
  data: DigitalReadinessLatest | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

function levelLabel(level: number, maturity: string) {
  if (!level) return "";
  if (!maturity) return `Level ${level}`;
  return `Level ${level} · ${maturity}`;
}

function levelColor(level: number): string {
  switch (level) {
    case 5:
      return "bg-emerald-500 text-white";
    case 4:
      return "bg-green-500 text-white";
    case 3:
      return "bg-amber-400 text-slate-900";
    case 2:
      return "bg-orange-400 text-white";
    case 1:
      return "bg-red-500 text-white";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export default function DigitalReadinessCard({
  data,
  isLoading,
  error,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading digital readiness…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">
          Unable to load Digital Readiness score.
        </p>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          No Digital Readiness score available yet.
        </p>
      </div>
    );
  }

  const pct = data.percent ?? (data.score / (data.max || 140)) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Digital Readiness
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Live score from Azure Data Explorer
          </p>
          {data.timestamp && (
            <p className="mt-1 text-[11px] text-slate-400">
              Last updated: {data.timestamp}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end">
          <div className="text-3xl font-semibold text-slate-900">
            {data.score}
            <span className="text-base font-normal text-slate-500">
              {" "}
              / {data.max ?? 140}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {pct.toFixed(1)}%
          </div>
          <span
            className={[
              "mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium",
              levelColor(data.level),
            ].join(" ")}
          >
            {levelLabel(data.level, data.maturity)}
          </span>
        </div>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
            background:
              data.level >= 4
                ? "linear-gradient(to right, #22c55e, #16a34a)"
                : data.level === 3
                ? "linear-gradient(to right, #fbbf24, #f97316)"
                : "linear-gradient(to right, #f97316, #ef4444)",
          }}
        />
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Based on 28-question Digital Readiness assessment. Max score 140.
      </p>
    </div>
  );
}

