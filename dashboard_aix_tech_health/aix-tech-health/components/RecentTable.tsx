type Row = {
  timestamp: string;
  session_id: string;
  participant_name: string;
  participant_role: string;
  overall_score_500: number;
};

export default function RecentTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Session</th>
            <th className="py-2 pr-4">Participant</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Score /500</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((r, i) => (
            <tr key={`${r.session_id}-${r.timestamp}-${i}`} className="border-b last:border-0">
              <td className="py-2 pr-4">{new Date(r.timestamp).toLocaleString()}</td>
              <td className="py-2 pr-4">{r.session_id}</td>
              <td className="py-2 pr-4">{r.participant_name}</td>
              <td className="py-2 pr-4">{r.participant_role}</td>
              <td className="py-2 pr-4">{r.overall_score_500}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
