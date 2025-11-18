"use client";
import useSWR from "swr";

export default function Filters({
  customer,
  participant,
  onChange
}: {
  customer: string;
  participant: string;
  onChange: (c: string, p: string) => void;
}) {
  const { data } = useSWR(
    customer ? `/api/options?customer=${encodeURIComponent(customer)}` : `/api/options`,
    async (url) => (await fetch(url)).json()
  );

  const customers: string[] = data?.customers ?? [customer].filter(Boolean);
  const participants: string[] = data?.participants ?? [participant].filter(Boolean);

  return (
    <div className="flex gap-4 items-center">
      <select
        className="border rounded px-2 py-1"
        value={customer}
        onChange={(e) => onChange(e.target.value, participant)}
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
      >
        <option value="">Select participant</option>
        {participants.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}
