type Row = {
  timestamp: string;
  session_id: string;
  participant_name: string;
  participant_role: string;
  overall_score_500: number;
};
export default function RecentTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold text-gray-600">
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Session</th>
            <th className="px-4 py-3">Participant</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3 text-right">Score /500</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r,i) => (
            <tr key={i} className="text-sm">
              <td className="px-4 py-3 text-gray-700">{new Date(r.timestamp).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-gray-600">{r.session_id}</td>
              <td className="px-4 py-3">{r.participant_name}</td>
              <td className="px-4 py-3 text-gray-600">{r.participant_role}</td>
              <td className="px-4 py-3 text-right font-semibold">{r.overall_score_500}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
