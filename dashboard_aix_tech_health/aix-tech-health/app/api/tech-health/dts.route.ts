// app/api/tech-health/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  Client,                         // <- this is the client class
  KustoConnectionStringBuilder,
  ClientRequestProperties,
} from "azure-kusto-data";

export const dynamic = "force-dynamic"; // don't cache

const CLUSTER = process.env.ADX_CLUSTER!;
const DB      = process.env.ADX_DATABASE!;
const TENANT  = process.env.ADX_TENANT_ID!;
const APP_ID  = process.env.ADX_CLIENT_ID!;
const SECRET  = process.env.ADX_CLIENT_SECRET!;

function makeClient() {
  const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
    CLUSTER,        // e.g. https://<cluster>.kusto.windows.net
    APP_ID,
    SECRET,
    TENANT          // tenant / authorityId
  );
  return new Client(kcsb);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer    = searchParams.get("customer") ?? "";
    const participant = searchParams.get("participant") ?? "";

    if (!customer || !participant) {
      return NextResponse.json(
        { error: "Missing required query params: customer, participant" },
        { status: 400 }
      );
    }

    // KQL from what you validated in ADX + the scalar AIX score
    const query = `
aix_scores
| where customer == "${customer}" and participant_name == "${participant}"
| top 1 by timestamp desc
| project last_updated = timestamp, overall_score_500
| extend level = case(
    overall_score_500 >= 401, "Level 5 — Leading",
    overall_score_500 >= 301, "Level 4 — Advanced",
    overall_score_500 >= 201, "Level 3 — Developing",
    overall_score_500 >= 101, "Level 2 — Initial",
    "Level 1 — Not Started"
)
| extend aix_score_500 = toscalar(aix_scores
    | where customer == "${customer}" and participant_name == "${participant}"
    | top 1 by timestamp desc
    | project overall_score_500)
| project last_updated, overall_score_500, level, aix_score_500
`;

    const client = makeClient();
    const props = new ClientRequestProperties();
    props.setOption("results_progressive_enabled", false);

    const res = await client.execute(DB, query, props);

    // Pull the first row safely
    const table = res.primaryResults[0];
    const rows = table?.toJSON?.()?.data ?? table?.rows ?? [];
    if (!rows.length) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const [last_updated, overall_score_500, level, aix_score_500] = rows[0];

    return NextResponse.json({
      customer,
      participant,
      last_updated,
      overall_score_500,
      level,
      aix_score_500,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "ADX query failed" },
      { status: 500 }
    );
  }
}

