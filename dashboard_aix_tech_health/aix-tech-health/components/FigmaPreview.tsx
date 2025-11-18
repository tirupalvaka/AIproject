"use client";
import useSWR from "swr";

const openInFigmaUrl = process.env.NEXT_PUBLIC_FIGMA_TECH_HEALTH_URL || process.env.FIGMA_TECH_HEALTH_URL;

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function FigmaPreview() {
  const { data, isLoading, error } = useSWR("/api/figma-snapshot", fetcher, {
    refreshInterval: 60_000,   // refresh png every minute (optional)
  });

  return (
    <div className="p-4 border rounded-xl bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Figma — Technical Health</h3>
        {openInFigmaUrl && (
          <a
            href={openInFigmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            Open in Figma
          </a>
        )}
      </div>

      {isLoading && <div className="text-sm text-slate-500">Loading preview…</div>}
      {error && <div className="text-sm text-red-600">Failed to load Figma preview.</div>}

      {data?.imageUrl && (
        <img
          src={data.imageUrl}
          alt="Figma Technical Health frame"
          className="w-full rounded border"
        />
      )}

      {!data?.imageUrl && !isLoading && !error && (
        <div className="text-sm text-slate-500">No preview available.</div>
      )}
    </div>
  );
}

