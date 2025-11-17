import logging
import json
import os

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder

# ---------------- ADX CONFIG ----------------

# You can override these via env vars or local.settings.json
ADX_CLUSTER = os.getenv("ADX_CLUSTER", "https://aix-dts.eastus2.kusto.windows.net")
ADX_DB = os.getenv("ADX_DB", "aixdb")
# Default scope for ADX when using DefaultAzureCredential
ADX_SCOPE = "https://kusto.kusto.windows.net/.default"

# -------------- FUNCTION APP ---------------

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def get_kusto_client() -> KustoClient:
    """
    Build a KustoClient using DefaultAzureCredential.

    Locally:
      - uses `az login` / Azure CLI / VS Code login (you already saw this working)
    In Azure:
      - will use the Function App's managed identity.
    """
    # Allow interactive browser as a fallback locally
    credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)

    # Get an access token for ADX
    access_token = credential.get_token(ADX_SCOPE).token

    # NOTE: method name is with_aad_token_authentication in azure-kusto-data 5.x
    kcsb = KustoConnectionStringBuilder.with_aad_token_authentication(
        ADX_CLUSTER,
        access_token,
    )

    return KustoClient(kcsb)


@app.route(route="ai_readiness_latest", methods=["GET"])
def ai_readiness_latest(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("ai_readiness_latest HTTP trigger called")

    # Kusto query: latest row per customer+participant, then most recent overall
    query = """
    ai_readiness_scores
    | summarize arg_max(timestamp, *) by customer, participant_name
    | project timestamp, customer, participant_name, total_105, percent, level, maturity
    | order by timestamp desc
    | take 1
    """

    try:
        client = get_kusto_client()
        result = client.execute(ADX_DB, query)

        cols = [c.column_name for c in result.primary_results.columns]
        rows = [
            {cols[i]: row[i] for i in range(len(cols))}
            for row in result.primary_results.rows
        ]

        if not rows:
            body = json.dumps({"error": "No AI readiness data found"})
            return func.HttpResponse(
                body, mimetype="application/json", status_code=404
            )

        body = json.dumps(rows[0], default=str)
        return func.HttpResponse(body, mimetype="application/json", status_code=200)

    except Exception as exc:
        logging.exception("Error querying ADX")
        body = json.dumps({"error": str(exc)})
        return func.HttpResponse(
            body,
            mimetype="application/json",
            status_code=500,
        )

