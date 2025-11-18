// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { useSearchParams, useRouter } from "next/navigation";

// Relative imports
import HealthGauge from "../../components/HealthGauge";
import LevelPill from "../../components/LevelPill";
import RecentTable from "../../components/RecentTable";
import Filters from "../../components/Filters";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const search = useSearchParams();
  const router = useRouter();

  const customer = search.get("customer") ?? "";
  const participant = search.get("participant") ?? "";

  const query = useMemo(() => {
    if (!customer || !participant) return null;
    const c = encodeURIComponent(customer);
    const p = encodeURIComponent(participant);
    return `/api/tech-health?customer=${c}&participant=${p}`;
  }, [customer, participant]);

  // Live refresh every 30s
  const { data, error, isLoading, mutate } = useSWR(
    query,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true }
  );

  // Figma snapshot (no params needed)
  const { data: figma, error: figErr } = useSWR(`/api/figma-snapshot`, fetcher, {
    refreshInterval: 60_000,
  });

  // When user changes filters, update the URL
  const onChangeFilters = (c: string, p: string) => {
    const url = `/dashboard?customer=${encodeURIComponent(c)}&participant=${encodeURIComponent(p)}`;
    router.push(url);
    if (c && p) mutate();
  };

  // --- Level text color mapping (ties to gauge score) ---
  const score = data?.gauge?.score500 ?? 0;
  const levelName = data?.gauge?.name ?? "";
  const levelColorClass = useMemo(() => {
    if (score >= 401) return "text-green-600";   // Level 5 — Leading
    if (score >= 301) return "text-yellow-600";  // Level 4 — Advanced
    if (score >= 201) return "text-orange-600";  // Level 3 — Developing
    if (score >= 101) return "text-red-600";     // Level 2 — Initial
    return "text-gray-600";                      // Level 1 — Not Started
  }, [score]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <Filters
          customer={customer}
          participant={participant}
          onChange={onChangeFilters}
        />
        <div className="text-xs text-slate-500">
          {isLoading ? "Loading…" : data?.latest?.timestamp
            ? `Live as of ${new Date(data.latest.timestamp).toLocaleString()}`
            : ""}
        </div>
      </div>

      {/* Top row: Gauge + Level + Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Technical Health</h2>
              {data?.gauge && <LevelPill levelName={levelName} />}
            </div>

            {/* New: colored level text (matches score bands) */}
            {levelName && (
              <p className={`text-sm font-medium ${levelColorClass} mb-2`}>
                {levelName}
              </p>
            )}

            <HealthGauge score={score} />

            <div className="mt-2 text-sm text-slate-600">
              {data?.latest?.participant_name
                ? `${data.latest.participant_name} • ${data.latest.participant_role ?? ""}`
                : ""}
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <h3 className="text-base font-medium mb-2">Recent Sessions</h3>
            <RecentTable rows={Array.isArray(data?.recent) ? data!.recent : []} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-medium">Technical Health (Figma)</h3>
            <a
              className="text-xs underline text-slate-600"
              href={process.env.NEXT_PUBLIC_FIGMA_TECH_HEALTH_URL}
              target="_blank" rel="noreferrer"
            >
              Open in Figma
            </a>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/5 flex items-center justify-center">
            {figma?.imageUrl ? (
              <img
                src={figma.imageUrl}
                alt="Figma snapshot"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-sm text-slate-500">
                {figErr ? "Figma failed to load" : "Loading preview…"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          Failed to load data: {String(error)}
        </div>
      )}
    </div>
  );
}

