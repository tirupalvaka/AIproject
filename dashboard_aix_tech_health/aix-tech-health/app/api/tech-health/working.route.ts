import { NextRequest, NextResponse } from "next/server";
import { getKustoClient } from "@/lib/kusto";

const DB = process.env.KUSTO_DB!;

function toLevel(score500: number) {
  if (score500 >= 401) return { level: 5, name: "Leading" };
  if (score500 >= 301) return { level: 4, name: "Advanced" };
  if (score500 >= 201) return { level: 3, name: "Developing" };
  if (score500 >= 101) return { level: 2, name: "Initial" };
  return { level: 1, name: "Not Started" };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer = searchParams.get("customer") ?? process.env.DEFAULT_CUSTOMER ?? "Contoso";
    const participant = searchParams.get("participant"); // optional

    // Latest selected participant OR latest overall for customer
    const whereParticipant = participant ? `and participant_name == "${participant}"` : "";
    const latestQuery = `
      aix_scores
      | where customer == "${customer}" ${whereParticipant}
      | top 1 by timestamp desc
      | project timestamp, session_id, customer, industry, assessment_type, participant_name, participant_role, org, overall_score_500
    `;

    const recentQuery = `
      aix_scores
      | where customer == "${customer}" ${whereParticipant}
      | top 10 by timestamp desc
      | project timestamp, session_id, participant_name, participant_role, overall_score_500
    `;

    const client = getKustoClient();

    const latestRes: any = await client.execute(DB, latestQuery);
    const recentRes: any = await client.execute(DB, recentQuery);

    const latest = latestRes.primaryResults[0]?.toJson()?.data[0] ?? null;
    const recent = recentRes.primaryResults[0]?.toJson()?.data ?? [];

    const score = latest?.overall_score_500 ?? 0;
    const level = toLevel(score);

    return NextResponse.json({
      customer,
      participant: latest?.participant_name ?? participant ?? null,
      latest: latest,
      recent: recent,
      gauge: { score500: score, ...level },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "query_failed" }, { status: 500 });
  }
}

