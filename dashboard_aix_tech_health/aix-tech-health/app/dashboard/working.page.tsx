"use client";

import useSWR from "swr";
import { useSearchParams, useRouter } from "next/navigation";

import Filters from "../../components/Filters";
import HealthGauge from "../../components/HealthGauge";
import LevelPill from "../../components/LevelPill";
import RecentTable from "../../components/RecentTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();

  const customer = params.get("customer") || "";
  const participant = params.get("participant") || "";

  const { data, isLoading } = useSWR(
    customer && participant
      ? `/api/tech-health?customer=${encodeURIComponent(customer)}&participant=${encodeURIComponent(participant)}`
      : null,
    fetcher
  );

  const latest = data?.latest;
  const gauge = data?.gauge;
  const recent = data?.recent || [];

  const handleChange = (c: string, p: string) => {
    const qs = new URLSearchParams();
    if (c) qs.set("customer", c);
    if (p) qs.set("participant", p);
    router.push(`/dashboard?${qs.toString()}`);
  };

  const score = Number(gauge?.score500 ?? 0);
  const levelName = gauge?.name ?? "";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <Filters customer={customer} participant={participant} onChange={handleChange} />
      </div>

      {(!customer || !participant) && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          Select a customer and participant to view scores.
        </div>
      )}

      {customer && participant && (
        <>
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-1">
              <HealthGauge score={score} />
              <div className="mt-3">
                <LevelPill levelName={levelName} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
              <div className="mb-3 text-sm text-gray-500">
                Latest score for <span className="font-medium text-gray-800">{latest?.participant_name}</span> — {latest?.customer}
              </div>
              <div className="text-4xl font-semibold">{score}<span className="ml-1 text-lg text-gray-400">/ 500</span></div>
              <div className="mt-1 text-sm text-gray-500">{latest?.participant_role}</div>
              <div className="mt-1 text-sm text-gray-400">{latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : ""}</div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Recent sessions</h2>
            <RecentTable rows={recent} />
          </section>
        </>
      )}

      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
    </div>
  );
}

