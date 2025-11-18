"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Filters({
  customer,
  participant,
  onChange,
}: {
  customer: string;
  participant: string;
  onChange: (c: string, p: string) => void;
}) {
  const { data } = useSWR("/api/options", fetcher);

  const customers: string[] = data?.customers ?? [];
  const partsByCust: Record<string, string[]> = data?.participantsByCustomer ?? {};
  const participants: string[] = customer ? (partsByCust[customer] ?? []) : [];

  return (
    <div className="flex items-center gap-4">
      <select
        className="border rounded px-2 py-1"
        value={customer}
        onChange={(e) => onChange(e.target.value, "")}
      >
        <option value="">Select customer</option>
        {customers.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className="border rounded px-2 py-1"
        value={participant}
        onChange={(e) => onChange(customer, e.target.value)}
        disabled={!customer}
      >
        <option value="">{customer ? "Select participant" : "Pick a customer first"}</option>
        {participants.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}

