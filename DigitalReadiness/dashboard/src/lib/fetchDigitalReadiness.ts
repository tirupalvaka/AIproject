export type DigitalReadinessResult = {
  score: number;
  max: number;
  percent: number;
  level: number;
  maturity: string;
  timestamp: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_DIGITAL_READINESS_API ??
  "https://aix-voice-service-gbczb3badydydcgu.eastus2-01.azurewebsites.net/api";

export async function fetchDigitalReadiness(
  customer: string,
  participant: string
): Promise<DigitalReadinessResult> {
  const params = new URLSearchParams();
  if (customer) params.set("customer", customer);
  if (participant) params.set("participant", participant);

  const url = `${API_BASE}/digital_readiness_latest_live?${params.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch digital readiness: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

