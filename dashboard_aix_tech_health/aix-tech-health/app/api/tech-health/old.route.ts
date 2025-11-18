// app/api/tech-health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { KustoClient, KqlQueryV2 } from "azure-kusto-data";

const CLUSTER = process.env.ADX_CLUSTER!;
const DB      = process.env.ADX_DATABASE!;
const TENANT  = process.env.ADX_TENANT_ID!;
const APPID   = process.env.ADX_CLIENT_ID!;
const SECRET  = process.env.ADX_CLIENT_SECRET!;

const KQL = `
aix_scores
| where customer == tostring(_cust) and participant_name == tostring(_part)
| top 1 by timestamp desc
| project last_updated = timestamp, overall_score_500
| extend level = case(
    overall_score_500 >= 401, "Level 5 — Leading",
    overall_score_500 >= 301, "Level 4 — Advanced",
    overall_score_500 >= 201, "Level 3 — Developing",
    overall_score_500 >= 101, "Level 2 — Initial",
    "Level 1 — Not Started"
)
| extend aix_score_500 = toscalar(
    aix_scores
    | where customer == tostring(_cust) and participant_name == tostring(_part)
    | top 1 by timestamp desc
    | project overall_score_500
)
`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const _cust = url.searchParams.get("customer") ?? "L&G";
  const _part = url.searchParams.get("participant") ?? "Tirupal";

  const csb = `https://login.microsoftonline.com/${TENANT};` +
              `AppClientId=${APPID};AppKey=${SECRET};` +
              `Authority Id=${TENANT};Fed=true;Data Source=${CLUSTER};`;

  const client = new KustoClient(csb);
  const query: KqlQueryV2 = { db: DB, csl: KQL, properties: { Parameters: { _cust, _part } } };
  const res = await client.executeV2(DB, query);
  const row = res.primaryResults[0].toJson().data[0] ?? null;

  return NextResponse.json(row ?? {});
}

