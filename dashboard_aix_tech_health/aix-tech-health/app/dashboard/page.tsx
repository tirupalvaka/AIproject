// app/dashboard/page.tsx
"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useSearchParams, useRouter } from "next/navigation";

import HealthGauge from "../../components/HealthGauge";
import LevelPill from "../../components/LevelPill";
import RecentTable from "../../components/RecentTable";
import Filters from "../../components/Filters";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function levelColor(score500: number) {
  if (score500 >= 401) return { cls: "text-green-600", hex: "#16a34a" };   // Leading
  if (score500 >= 301) return { cls: "text-yellow-600", hex: "#ca8a04" };  // Advanced
  if (score500 >= 201) return { cls: "text-orange-600", hex: "#ea580c" };  // Developing
  if (score500 >= 101) return { cls: "text-red-600", hex: "#dc2626" };     // Initial
  return { cls: "text-gray-600", hex: "#4b5563" };                          // Not Started
}

export default function Dashboard() {
  const search = useSearchParams();
  const router = useRouter();

  const customer = search.get("customer") ?? "";
  const participant = search.get("participant") ?? "";

  const query = useMemo(() => {
    if (!customer || !participant) return null;
    return `/api/tech-health?customer=${encodeURIComponent(customer)}&participant=${encodeURIComponent(participant)}`;
  }, [customer, participant]);

  const { data, error, isLoading, mutate } = useSWR(query, fetcher, {
    refreshInterval: 30_000, revalidateOnFocus: true
  });

  const { data: figma, error: figErr } = useSWR(`/api/figma-snapshot`, fetcher, {
    refreshInterval: 60_000,
  });

  const onChangeFilters = (c: string, p: string) => {
    router.push(`/dashboard?customer=${encodeURIComponent(c)}&participant=${encodeURIComponent(p)}`);
    if (c && p) mutate();
  };

  const score = data?.gauge?.score500 ?? 0;
  const levelName = data?.gauge?.name ?? "";
  const { cls, hex } = levelColor(score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Filters customer={customer} participant={participant} onChange={onChangeFilters} />
        <div className="text-xs text-slate-500">
          {isLoading ? "Loading…" : data?.latest?.timestamp ? `Live as of ${new Date(data.latest.timestamp).toLocaleString()}` : ""}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Technical Health</h2>
              {data?.gauge && <LevelPill levelName={levelName} />}
            </div>

            {/* Colored level label (Tailwind + inline color fallback) */}
            {levelName && (
              <p className={`text-sm font-medium mb-2 ${cls}`} style={{ color: hex }}>
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
              <img src={figma.imageUrl} alt="Figma snapshot" className="w-full h-full object-contain" />
            ) : (
              <div className="text-sm text-slate-500">
                {figErr ? "Figma failed to load" : "Loading preview…"}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          Failed to load data: {String(error)}
        </div>
      )}
    </div>
  );
}

