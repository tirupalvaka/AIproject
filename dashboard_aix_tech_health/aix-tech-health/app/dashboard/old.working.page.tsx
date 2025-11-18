"use client";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import HealthGauge from "../../components/HealthGauge";
import LevelPill from "../../components/LevelPill";
import RecentTable from "../../components/RecentTable";
import Filters from "../../components/Filters";
import FigmaCard from "../../components/FigmaCard";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const sp = useSearchParams();
  const customer = sp.get("customer") || "L&G";
  const participant = sp.get("participant") || "Tirupal";

  const { data } = useSWR(
    `/api/tech-health?customer=${encodeURIComponent(customer)}&participant=${encodeURIComponent(participant)}`,
    fetcher
  );

  const score = data?.gauge?.score500 ?? 0;
  const levelName = data?.gauge?.name ?? "—";
  const rows = data?.recent ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: data */}
      <div className="lg:col-span-2 space-y-6">
        <Filters
          customer={customer}
          participant={participant}
          onChange={(c, p) => {
            const search = new URLSearchParams(window.location.search);
            if (c) search.set("customer", c); else search.delete("customer");
            if (p) search.set("participant", p); else search.delete("participant");
            window.history.replaceState({}, "", `/dashboard?${search.toString()}`);
            // SWR will revalidate automatically because key changes
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-white p-4">
            <HealthGauge score={score} />
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600 mb-1">Level</div>
            <LevelPill levelName={levelName} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium mb-2">Recent Sessions</div>
          <RecentTable rows={rows} />
        </div>
      </div>

      {/* Right: Figma */}
      <div className="space-y-6">
        <FigmaCard />
      </div>
    </div>
  );
}

