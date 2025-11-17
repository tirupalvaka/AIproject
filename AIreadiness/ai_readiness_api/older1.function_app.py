import logging
import json
import os

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder

# ---------- Azure Data Explorer config ----------
ADX_CLUSTER = os.getenv("ADX_CLUSTER", "https://aix-dts.eastus2.kusto.windows.net")
ADX_DB = os.getenv("ADX_DB", "aixdb")
ADX_SCOPE = "https://kusto.kusto.windows.net/.default"

# ---------- Function App ----------
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def get_kusto_client() -> KustoClient:
    """
    Uses DefaultAzureCredential:
    - locally: az login / VSCode login
    - in Azure: Managed Identity
    """
    cred = DefaultAzureCredential(exclude_interactive_browser_credential=False)
    token = cred.get_token(ADX_SCOPE).token

    kcsb = KustoConnectionStringBuilder.with_aad_token_authorization(
        ADX_CLUSTER, token
    )
    return KustoClient(kcsb)


@app.route(route="ai_readiness_latest", methods=["GET"])
def ai_readiness_latest(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("ai_readiness_latest HTTP trigger called")

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
        rows = []
        for r in result.primary_results.rows:
            rows.append({cols[i]: r[i] for i in range(len(cols))})

        if not rows:
            body = json.dumps({"error": "No AI readiness data found"})
            return func.HttpResponse(body, mimetype="application/json", status_code=404)

        body = json.dumps(rows[0], default=str)
        return func.HttpResponse(body, mimetype="application/json", status_code=200)

    except Exception as e:
        logging.exception("Error querying ADX")
        body = json.dumps({"error": str(e)})
        return func.HttpResponse(body, mimetype="application/json", status_code=500)

