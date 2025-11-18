import ScoreDial from "@/components/ScoreDial";

export default async function Page() {
  // TEMP sample values; you’ll replace with ADX results soon
  const latest = {
    customer: "L&G",
    participant: "Tirupal",
    role: "AI Architect",
    industry: "Insurance",
    session_id: "session_xyz_001",
    overall_score_500: 400, // 👈 shows “Leading” per your buckets
    timestamp: "2024-06-01T12:00:00Z",
  };

  const recent = [
    { session_id: "session_xyz_001", participant: "Tirupal", score: 400, when: "2024-06-01 12:00Z" },
    { session_id: "sess-2025-11-07-001", participant: "Alex Doe", score: 184, when: "2025-11-07 13:45Z" },
  ];

  return (
    <main className="space-y-6">
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
          <h2 className="mb-3 text-sm font-medium text-slate-600">Technical Health</h2>
          <ScoreDial value500={latest.overall_score_500} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-slate-600">Latest session</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Stat label="Customer" value={latest.customer} />
            <Stat label="Participant" value={latest.participant} />
            <Stat label="Role" value={latest.role} />
            <Stat label="Industry" value={latest.industry} />
            <Stat label="Session" value={latest.session_id} />
            <Stat label="Timestamp" value={latest.timestamp} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-600">Recent sessions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4">Session</th>
                <th className="py-2 pr-4">Participant</th>
                <th className="py-2 pr-4">Score (0–500)</th>
                <th className="py-2 pr-4">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recent.map((r) => (
                <tr key={r.session_id}>
                  <td className="py-2 pr-4 font-mono">{r.session_id}</td>
                  <td className="py-2 pr-4">{r.participant}</td>
                  <td className="py-2 pr-4">{r.score}</td>
                  <td className="py-2 pr-4">{r.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

