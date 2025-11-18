import { Client as KustoClient, KustoConnectionStringBuilder } from "azure-kusto-data";

const CLUSTER = process.env.KUSTO_URI!;
const TENANT  = process.env.AZURE_TENANT_ID!;
const APP_ID  = process.env.AZURE_CLIENT_ID!;
const SECRET  = process.env.AZURE_CLIENT_SECRET!;

if (!CLUSTER || !TENANT || !APP_ID || !SECRET) {
  console.warn("[kusto] Missing one or more env vars: KUSTO_URI / AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET");
}

export function getKustoClient() {
  const kcsb = KustoConnectionStringBuilder
    .withAadApplicationKeyAuthentication(CLUSTER, APP_ID, SECRET, TENANT);
  return new KustoClient(kcsb);
}

export async function query(db: string, csl: string) {
  const client = getKustoClient();
  const resp = await client.execute(db, csl);
  return resp;
}
