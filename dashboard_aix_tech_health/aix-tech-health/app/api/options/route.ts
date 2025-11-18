import { NextResponse } from "next/server";
import { getKustoClient } from "../../../lib/kusto"; // same path you used in tech-health

const DB = process.env.KUSTO_DB!;

/**
 * Returns:
 * {
 *   customers: string[],
 *   participantsByCustomer: { [customer: string]: string[] }
 * }
 */
export async function GET() {
  try {
    const kusto = getKustoClient();

    // 1) All customers
    const customersQuery = `
      aix_scores
      | where isnotempty(customer)
      | summarize by customer
      | order by customer asc
    `;
    const customersRes: any = await kusto.execute(DB, customersQuery);
    const customers: string[] =
      customersRes?.primaryResults?.[0]?.toJson()?.data?.map((r: any) => r.customer) ?? [];

    // 2) Participants per customer
    const participantsQuery = `
      aix_scores
      | where isnotempty(customer) and isnotempty(participant_name)
      | summarize participants = make_set(participant_name) by customer
      | order by customer asc
    `;
    const partsRes: any = await kusto.execute(DB, participantsQuery);
    const participantsByCustomer: Record<string, string[]> = {};
    const rows = partsRes?.primaryResults?.[0]?.toJson()?.data ?? [];
    for (const row of rows) {
      participantsByCustomer[row.customer] = row.participants?.sort?.() ?? [];
    }

    return NextResponse.json({ customers, participantsByCustomer });
  } catch (err: any) {
    console.error("options API error:", err?.message || err);
    return NextResponse.json({ error: "Failed to load options" }, { status: 500 });
  }
}

