// app/dashboard/page.tsx
"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import HealthGauge from "@/components/HealthGauge";
import LevelPill from "@/components/LevelPill";
import RecentTable from "@/components/RecentTable";
import Filters from "@/components/Filters";
import { scoreToHealthLevel } from "@/lib/levels";
import { useSearchParams, useRouter } from "next/navigation";

export default function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const customer = params.get("customer") ?? "";
  const participant = params.get("participant") ?? "";

  const { data } = useSWR(
    customer && participant
      ? `/api/tech-health?customer=${encodeURIComponent(customer)}&participant=${encodeURIComponent(participant)}`
      : null,
    fetcher
  );

  const latest = data?.latest;
  const score500: number = latest?.overall_score_500 ?? 0;
  const level = scoreToHealthLevel(score500);

  return (
    <main className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">AIX Technical Health</h2>

      <Filters
        customer={customer}
        participant={participant}
        onChange={(c, p) =>
          router.push(`/dashboard?customer=${encodeURIComponent(c)}&participant=${encodeURIComponent(p)}`)
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gauge card */}
        <HealthGauge
          score={score500}
          title="Technical Health"
          subtitle="0 — 500"
        />

        {/* Summary card */}
        <div className="p-4 border rounded-xl bg-white">
          <div className="text-base text-slate-500">Latest score for {participant || "—"} — {customer || "—"}</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="text-4xl font-bold">{score500}</div>
            <div className="text-slate-500">/ 500</div>
          </div>
          <div className="mt-3">
            <LevelPill score500={score500} />
          </div>
          <p className="mt-2 text-sm text-slate-600">{level.profile}</p>
        </div>
      </section>

      {/* Recent sessions */}
      <section className="p-4 border rounded-xl bg-white">
        <h3 className="text-lg font-medium mb-3">Recent sessions</h3>
        <RecentTable rows={data?.recent ?? []} />
      </section>
    </main>
  );
}

