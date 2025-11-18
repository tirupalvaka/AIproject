// app/api/tech-health/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  Client,
  KustoConnectionStringBuilder,
  ClientRequestProperties,
} from "azure-kusto-data";

// ---- Env (must be set in .env.local) ----
const CLUSTER = process.env.KUSTO_URI!;           // e.g. https://<cluster>.kusto.windows.net
const DB      = process.env.KUSTO_DB!;            // e.g. aixdb
const TENANT  = process.env.AZURE_TENANT_ID!;
const APP_ID  = process.env.AZURE_CLIENT_ID!;
const SECRET  = process.env.AZURE_CLIENT_SECRET!;

function makeClient() {
  if (!CLUSTER || !DB || !TENANT || !APP_ID || !SECRET) {
    throw new Error("Missing one or more required env vars: KUSTO_URI, KUSTO_DB, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET");
  }
  const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
    CLUSTER,
    APP_ID,
    SECRET,
    TENANT
  );
  return new Client(kcsb);
}

// KQL templates. We use query parameters via ClientRequestProperties.
const LATEST_KQL = `
declare query_parameters (cust:string, part:string);
aix_scores
| where customer == cust and participant_name == part
| top 1 by timestamp desc
| project timestamp, session_id, customer, industry, assessment_type,
          participant_name, participant_role, org, overall_score_500
`;

const RECENT_KQL = `
declare query_parameters (cust:string, part:string);
aix_scores
| where customer == cust and participant_name == part
| top 10 by timestamp desc
| project timestamp, session_id, participant_name, participant_role, overall_score_500
`;

function toLevelName(score500: number | undefined) {
  if (typeof score500 !== "number") return "Unknown";
  if (score500 >= 401) return "Level 5 — Leading";
  if (score500 >= 301) return "Level 4 — Advanced";
  if (score500 >= 201) return "Level 3 — Developing";
  if (score500 >= 101) return "Level 2 — Initial";
  return "Level 1 — Not Started";
}

export async function GET(req: NextRequest) {
  try {
    // Inputs
    const url = new URL(req.url);
    const customer = url.searchParams.get("customer") ?? "";
    const participant = url.searchParams.get("participant") ?? "";

    if (!customer || !participant) {
      return NextResponse.json(
        { error: "Missing required query params 'customer' and 'participant'." },
        { status: 400 }
      );
    }

    const kusto = makeClient();

    // Reusable request props with parameters
    const props = new ClientRequestProperties();
    props.setParameter("cust", customer);
    props.setParameter("part", participant);

    // Execute queries
    const latestRes = await kusto.executeQuery(DB, LATEST_KQL, props);
    const recentRes = await kusto.executeQuery(DB, RECENT_KQL, props);

    // Parse result tables
    // azure-kusto-data returns a .primaryResults[0] with .toJSON() for rows
    const latestRows = latestRes?.primaryResults?.[0]?.toJSON() ?? [];
    const recentRows = recentRes?.primaryResults?.[0]?.toJSON() ?? [];

    const latest = latestRows[0]; // may be undefined if no data
    const score500 = latest?.overall_score_500 as number | undefined;

    const payload = {
      customer,
      participant,
      latest: latest ?? null,
      recent: recentRows,
      gauge: latest
        ? {
            score500: score500 ?? 0,
            level: typeof score500 === "number"
              ? (score500 >= 401 ? 5 :
                 score500 >= 301 ? 4 :
                 score500 >= 201 ? 3 :
                 score500 >= 101 ? 2 : 1)
              : null,
            name: toLevelName(score500),
          }
        : null,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    const msg = (err && err.message) ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

