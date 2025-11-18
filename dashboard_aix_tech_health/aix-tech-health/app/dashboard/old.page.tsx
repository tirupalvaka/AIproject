"use client";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import HealthGauge from "../../components/HealthGauge";
import LevelPill from "../../components/LevelPill";
import RecentTable from "../../components/RecentTable";
import Filters from "../../components/Filters";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const sp = useSearchParams();
  const customer = sp.get("customer") ?? "L&G";
  const participant = sp.get("participant") ?? "Tirupal";

  const { data, error, isLoading } = useSWR(
    `/api/tech-health?customer=${encodeURIComponent(customer)}&participant=${encodeURIComponent(participant)}`,
    fetcher
  );

  if (error) return <div className="p-8 text-red-600">Error: {String(error)}</div>;
  if (isLoading || !data) return <div className="p-8">Loading…</div>;

  const { latest, recent, gauge } = data;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AIX Technical Health</h1>
        <LevelPill level={gauge.level} name={gauge.name} />
      </div>

      <Filters customers={[latest.customer]} participants={[latest.participant_name]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-2xl shadow p-6">
          <div className="mb-4 text-sm text-gray-500">
            Latest score for {latest.participant_name} — {latest.customer}
          </div>
          <HealthGauge score500={gauge.score500} />
        </div>

        <div className="col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="mb-4 text-base font-semibold">Recent sessions</div>
          <RecentTable rows={recent} />
        </div>
      </div>
    </div>
  );
}
