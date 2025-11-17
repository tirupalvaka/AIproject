// src/lib/fetchDigitalReadiness.ts

export type DigitalReadinessLatest = {
  score: number;
  max: number;
  percent: number;
  level: number;
  maturity: string;
  timestamp: string;
};

const DEFAULT_CUSTOMER = "Contoso";
const DEFAULT_PARTICIPANT = "Alex Doe";

// You can override with NEXT_PUBLIC_DIGITAL_READINESS_LIVE_URL if needed
const API_URL =
  process.env.NEXT_PUBLIC_DIGITAL_READINESS_LIVE_URL ||
  `https://aix-voice-service-gbczb3badydydcgu.eastus2-01.azurewebsites.net/api/digital_readiness_latest_live?customer=${encodeURIComponent(
    DEFAULT_CUSTOMER
  )}&participant=${encodeURIComponent(DEFAULT_PARTICIPANT)}`;

export async function fetchDigitalReadiness(): Promise<DigitalReadinessLatest> {
  const res = await fetch(API_URL, {
    next: { revalidate: 5 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch digital readiness: ${res.status}`);
  }

  const data = await res.json();

  return {
    score: data.score ?? 0,
    max: data.max ?? 140,
    percent: data.percent ?? 0,
    level: data.level ?? 0,
    maturity: data.maturity ?? "",
    timestamp: data.timestamp ?? "",
  };
}

