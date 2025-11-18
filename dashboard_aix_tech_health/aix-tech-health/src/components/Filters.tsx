"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  customers: string[];
  participants: string[];
};

export default function Filters({ customers, participants }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(sp.get("customer") ?? "");
  const [participant, setParticipant] = useState(sp.get("participant") ?? "");

  function apply() {
    const qs = new URLSearchParams();
    if (customer) qs.set("customer", customer);
    if (participant) qs.set("participant", participant);
    router.push(`/dashboard?${qs.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-500">Customer</label>
        <select className="mt-1 rounded-lg border px-3 py-2" value={customer} onChange={e=>setCustomer(e.target.value)}>
          <option value="">(select)</option>
          {customers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500">Participant</label>
        <select className="mt-1 rounded-lg border px-3 py-2" value={participant} onChange={e=>setParticipant(e.target.value)}>
          <option value="">(select)</option>
          {participants.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button onClick={apply} className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700">
        Apply
      </button>
    </div>
  );
}
