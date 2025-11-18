import { KustoConnectionStringBuilder, Client as KustoClient } from "azure-kusto-data";

export function getKustoClient() {
  const cluster = process.env.KUSTO_URI!;
  const tenant = process.env.AZURE_TENANT_ID!;
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;

  const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
    cluster, clientId, clientSecret, tenant
  );

  return new KustoClient(kcsb);
}

