export type AIReadinessRecord = {
  timestamp: string;
  customer: string;
  participant_name: string;
  total_105: number;
  percent: number;
  level: number;
  maturity: string;
};

export async function fetchAIReadiness(): Promise<AIReadinessRecord> {
  const url = process.env.NEXT_PUBLIC_AI_READINESS_API!;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  return data as AIReadinessRecord;
}

