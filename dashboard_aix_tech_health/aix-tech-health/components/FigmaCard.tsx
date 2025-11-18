"use client";
import useSWR from "swr";

export default function FigmaCard() {
  const { data, error, isLoading } = useSWR("/api/figma-snapshot", u => fetch(u).then(r => r.json()));

  if (isLoading) return <div className="text-sm text-slate-600">Loading Figma preview…</div>;
  if (error || data?.error) {
    const msg = data?.error || (error as any)?.message || "Unknown error";
    return <div className="text-sm text-red-600">Figma preview failed: {msg}</div>;
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Technical Health (Figma)</div>
        <a
          className="text-xs underline text-blue-600"
          href={process.env.NEXT_PUBLIC_FIGMA_TECH_HEALTH_URL || "#"}
          target="_blank" rel="noreferrer"
        >
          Open in Figma
        </a>
      </div>
      {data?.imageUrl ? (
        <img
          src={data.imageUrl}
          alt="Figma snapshot"
          className="rounded-md w-full h-auto shadow-sm"
        />
      ) : (
        <div className="text-slate-600 text-sm">No image returned.</div>
      )}
    </div>
  );
}

