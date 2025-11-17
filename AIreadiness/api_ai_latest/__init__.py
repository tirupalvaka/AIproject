import logging
import os
import json

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder

# Configure these via local.settings.json or env vars if you want
ADX_CLUSTER = os.environ.get("ADX_CLUSTER", "https://aix-dts.eastus2.kusto.windows.net")
ADX_DB = os.environ.get("ADX_DB", "aixdb")
ADX_SCOPE = "https://kusto.kusto.windows.net/.default"


def get_kusto_client() -> KustoClient:
    # Uses your local Azure login (Azure CLI / VS Code) when running locally,
    # and Managed Identity when deployed.
    credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
    token = credential.get_token(ADX_SCOPE).token
    kcsb = KustoConnectionStringBuilder.with_aad_token_authorization(
        ADX_CLUSTER, token
    )
    return KustoClient(kcsb)


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("ai_readiness_latest HTTP trigger function processed a request.")

    try:
        client = get_kusto_client()

        query = """
        ai_readiness_scores
        | summarize arg_max(timestamp, *) by customer, participant_name
        | project timestamp, customer, participant_name, total_105, percent, level, maturity
        | order by timestamp desc
        | take 1
        """

        result = client.execute(ADX_DB, query)
        cols = [c.column_name for c in result.primary_results.columns]

        rows = []
        for row in result.primary_results.rows:
            rows.append({cols[i]: row[i] for i in range(len(cols))})

        if not rows:
            return func.HttpResponse(
                json.dumps({"error": "No AI readiness data found"}),
                status_code=404,
                mimetype="application/json",
            )

        body = json.dumps(rows[0], default=str)
        return func.HttpResponse(body, mimetype="application/json")

    except Exception as e:
        logging.exception("Error querying ADX")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json",
        )

