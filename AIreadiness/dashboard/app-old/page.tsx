"use client";
import useSWR from "swr";
import AIDial from "../components/AIDial";

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Page() {
  const { data, error } = useSWR("/api/ai_readiness_latest", fetcher, {
    refreshInterval: 5000 // 🔴 live polling every 5 seconds
  });

  if (!data) return <div>Loading…</div>;

  return (
    <div>
      <h2>AI Readiness</h2>
      <AIDial total={data.total_105} level={data.level} percent={data.percent} />
      <div>Maturity: {data.maturity}</div>
    </div>
  );
}

