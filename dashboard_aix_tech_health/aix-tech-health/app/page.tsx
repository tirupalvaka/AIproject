"use client";

import { useEffect, useMemo, useState } from "react";
import Gauge from "@/components/Gauge";
import LevelChip from "@/components/LevelChip";

type ApiResp = {
  customer: string;
  participant: string | null;
  latest: any;
  recent: any[];
  gauge: { score500: number; level: number; name: string };
};

export default function Page() {
  const [customer, setCustomer] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_CUSTOMER ?? "");
  const [participant, setParticipant] = useState<string>("");
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (customer) p.set("customer", customer);
    if (participant) p.set("participant", participant);
    return p.toString();
  }, [customer, participant]);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/tech-health?${qs}`);
    const j = await r.json();
    setData(j);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Technical Health — AIX</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Customer (e.g., Contoso or L&G)"
            className="border rounded px-3 py-2 text-sm"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
          <input
            placeholder="Participant (optional)"
            className="border rounded px-3 py-2 text-sm"
            value={participant}
            onChange={(e) => setParticipant(e.target.value)}
          />
          <button onClick={load} className="rounded-lg px-4 py-2 bg-black text-white text-sm disabled:opacity-50" disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* Technical Health card */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-3">Technical Health</div>
          <Gauge value={data?.gauge.score500 ?? 0} />
          <div className="mt-4">
            {data && <LevelChip level={data.gauge.level} name={data.gauge.name} />}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {data?.participant ? `Latest for ${data.participant}` : `Latest for ${data?.customer ?? "-"}`}
          </div>
        </div>

        {/* Summary */}
        <div className="col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="text-sm text-gray-500">Summary</div>
          <div className="mt-2">
            {data?.latest ? (
              <ul className="text-sm text-gray-800 space-y-1">
                <li><b>Timestamp:</b> {new Date(data.latest.timestamp).toLocaleString()}</li>
                <li><b>Customer:</b> {data.latest.customer}</li>
                <li><b>Participant:</b> {data.latest.participant_name} ({data.latest.participant_role})</li>
                <li><b>Org:</b> {data.latest.org}</li>
              </ul>
            ) : (
              <div className="text-gray-500 text-sm">No data yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Recent sessions */}
      <section className="bg-white rounded-2xl shadow p-6">
        <div className="text-sm text-gray-500 mb-3">Recent sessions</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Timestamp</th>
                <th className="py-2 pr-4">Session</th>
                <th className="py-2 pr-4">Participant</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Score /500</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent ?? []).map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 pr-4">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.session_id}</td>
                  <td className="py-2 pr-4">{r.participant_name}</td>
                  <td className="py-2 pr-4">{r.participant_role}</td>
                  <td className="py-2 pr-4">{Math.round(r.overall_score_500)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

