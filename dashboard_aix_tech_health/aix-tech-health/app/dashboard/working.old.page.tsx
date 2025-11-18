"use client";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import HealthGauge from "../../components/HealthGauge";
import LevelPill from "../../components/LevelPill";
import RecentTable from "../../components/RecentTable";
import Filters from "../../components/Filters";
import { useSearchParams, useRouter } from "next/navigation";
import { levelForScore } from "../../lib/levels";

export default function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const customer = params.get("customer") ?? "";
  const participant = params.get("participant") ?? "";

  const { data } = useSWR(
    customer && participant ? `/api/tech-health?customer=${encodeURIComponent(customer)}&participant=${encodeURIComponent(participant)}` : null,
    fetcher
  );

  const score = data?.gauge?.score500 ?? 0;
  const { name: levelName, tone } = levelForScore(score);

  const onChange = (c: string, p: string) => {
    const qp = new URLSearchParams();
    if (c) qp.set("customer", c);
    if (p) qp.set("participant", p);
    router.push(`/dashboard?${qp.toString()}`);
  };

  return (
    <main className="space-y-6">
      {/* Page title bar to match Figma rhythm */}
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Readiness Overview</h2>
        <p className="mt-1 text-slate-600">Live ADX-backed scores</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Filters customer={customer} participant={participant} onChange={onChange} />
      </div>

      {/* Cards row (only Technical Health for now) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-1">
          <HealthGauge
            score={score}
            max={500}
            label="Technical Health"
            caption="Score indicates level of code complexity and rework needed."
            accent={tone === "green" ? "green" : tone === "yellow" ? "yellow" : tone === "orange" ? "orange" : "red"}
          />
          <div className="mt-3">
            <LevelPill text={levelName} tone={tone as any} />
          </div>
        </div>

        {/* Placeholder cards to align like Figma (optional) */}
        {/* <div className="col-span-1 h-[260px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"></div>
        <div className="col-span-1 h-[260px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"></div> */}
      </div>

      {/* Recent sessions table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-lg font-semibold">Recent sessions</div>
        <RecentTable rows={data?.recent ?? []} />
      </div>
    </main>
  );
}

