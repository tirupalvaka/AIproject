"use client";

import useSWR from "swr";
import AIGauge from "@/components/AIGauge";
import { fetchAIReadiness } from "@/lib/fetcher";

export default function AIReadinessPage() {
  const { data, error, isLoading } = useSWR(
    "ai-readiness-latest",
    fetchAIReadiness,
    { refreshInterval: 5000 }
  );

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {String(error)}</div>;
  if (!data) return <div className="p-6">No AI readiness data yet.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-xl font-semibold mb-4">AI Readiness Overview</h1>
      <AIGauge total={data.total_105} />
      <p className="mt-4 text-sm text-gray-600">
        Customer: <strong>{data.customer}</strong> · Participant:{" "}
        <strong>{data.participant_name}</strong>
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Last updated: {String(data.timestamp)}
      </p>
    </div>
  );
}

