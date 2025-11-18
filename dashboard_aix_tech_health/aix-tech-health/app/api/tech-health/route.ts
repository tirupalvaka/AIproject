// app/api/tech-health/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime (not Edge)

// ----- ENV -----
const CLUSTER = process.env.KUSTO_URI!;         // e.g. https://aix-dts.eastus2.kusto.windows.net
const DB      = process.env.KUSTO_DB!;          // e.g. aixdb
const TENANT  = process.env.AZURE_TENANT_ID!;
const APP_ID  = process.env.AZURE_CLIENT_ID!;
const SECRET  = process.env.AZURE_CLIENT_SECRET!;

// Kusto REST v2 query endpoint
const KUSTO_QUERY_URL = `${CLUSTER}/v2/rest/query`;

// ----- Helpers -----
function levelFromScore(score: number) {
  if (score >= 401) return { level: 5, name: "Level 5 — Leading" };
  if (score >= 301) return { level: 4, name: "Level 4 — Advanced" };
  if (score >= 201) return { level: 3, name: "Level 3 — Developing" };
  if (score >= 101) return { level: 2, name: "Level 2 — Initial" };
  return { level: 1, name: "Level 1 — Not Started" };
}

async function getClientCredentialsToken() {
  const url = `https://login.microsoftonline.com/${encodeURIComponent(TENANT)}/oauth2/v2.0/token`;
  const form = new URLSearchParams();
  form.set("client_id", APP_ID);
  form.set("client_secret", SECRET);
  form.set("scope", "https://kusto.kusto.windows.net/.default");
  form.set("grant_type", "client_credentials");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AAD token failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

// Parse Kusto REST (v2 frames) to the first PrimaryResult as array of objects
function parsePrimaryResult(json: any): any[] {
  if (!Array.isArray(json)) return [];
  // Find the frame with TableKind === "PrimaryResult"
  const table = json.find(
    (f: any) => f.FrameType === "DataTable" && f.TableKind === "PrimaryResult"
  );
  if (!table) return [];
  const cols = table.Columns?.map((c: any) => c.ColumnName) ?? [];
  const rows = table.Rows ?? [];
  return rows.map((arr: any[]) => {
    const obj: any = {};
    cols.forEach((name: string, i: number) => (obj[name] = arr[i]));
    return obj;
  });
}

async function kustoQuery(csl: string, token: string) {
  const body = JSON.stringify({ db: DB, csl });
  const res = await fetch(KUSTO_QUERY_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kusto query ${res.status}: ${text}`);
  }
  // Kusto v2 returns an array of frames
  return res.json();
}

// ----- KQL (case-insensitive) -----
const LATEST_KQL = `
declare query_parameters (cust:string, part:string);
aix_scores
| where tolower(customer) == tolower(cust)
  and tolower(participant_name) == tolower(part)
| top 1 by timestamp desc
| project timestamp, session_id, customer, industry, assessment_type,
          participant_name, participant_role, org, overall_score_500
`;

const RECENT_KQL = `
declare query_parameters (cust:string, part:string);
aix_scores
| where tolower(customer) == tolower(cust)
  and tolower(participant_name) == tolower(part)
| top 10 by timestamp desc
| project timestamp, session_id, participant_name, participant_role, overall_score_500
`;

function injectParams(kql: string, customer: string, participant: string) {
  // Replace declare params line with inlined literals (simple & safe here)
  const esc = (s: string) => s.replace(/"/g, '\\"');
  // We can append a let to define params to avoid escaping in where:
  const header = `let cust = "${esc(customer)}"; let part = "${esc(participant)}";\n`;
  return header + kql.replace(/^declare.*\n/m, ""); // drop original declare
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const customer = url.searchParams.get("customer") ?? "";
    const participant = url.searchParams.get("participant") ?? "";

    if (!customer || !participant) {
      return NextResponse.json(
        { error: "Missing required query params 'customer' and 'participant'." },
        { status: 400 }
      );
    }

    const token = await getClientCredentialsToken();

    const [latestFrames, recentFrames] = await Promise.all([
      kustoQuery(injectParams(LATEST_KQL, customer, participant), token),
      kustoQuery(injectParams(RECENT_KQL, customer, participant), token),
    ]);

    const latestRows = parsePrimaryResult(latestFrames);
    const recentRows = parsePrimaryResult(recentFrames);

    const latest = latestRows[0] ?? null;

    let gauge: null | { score500: number; level: number; name: string } = null;
    if (latest?.overall_score_500 != null && typeof latest.overall_score_500 === "number") {
      const score500 = latest.overall_score_500 as number;
      const { level, name } = levelFromScore(score500);
      gauge = { score500, level, name };
    }

    return NextResponse.json({
      customer,
      participant,
      latest,         // object | null
      recent: recentRows, // array
      gauge           // object | null
    });
  } catch (err: any) {
    console.error("tech-health GET error:", err);
    return NextResponse.json(
      { error: "ADX query failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

