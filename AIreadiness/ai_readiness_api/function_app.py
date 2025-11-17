import logging
import json
import os

import azure.functions as func
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder

# ---------------- ADX CONFIG ----------------

ADX_CLUSTER = os.getenv("ADX_CLUSTER", "https://aix-dts.eastus2.kusto.windows.net")
ADX_DB = os.getenv("ADX_DB", "aixdb")


app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def get_kusto_client() -> KustoClient:
    """
    Build a KustoClient using Azure CLI authentication.
    Make sure you've run `az login` in this shell.
    """
    kcsb = KustoConnectionStringBuilder.with_az_cli_authentication(ADX_CLUSTER)
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
        response = client.execute(ADX_DB, query)

        # primary_results is a LIST of tables – take the first one
        table = response.primary_results[0]

        # Build list of dicts from the table
        col_names = [c.column_name for c in table.columns]
        rows = []
        for r in table:
            row_dict = {col_names[i]: r[i] for i in range(len(col_names))}
            rows.append(row_dict)

        if not rows:
            body = json.dumps({"error": "No AI readiness data found"})
            return func.HttpResponse(body, mimetype="application/json", status_code=404)

        body = json.dumps(rows[0], default=str)
        return func.HttpResponse(body, mimetype="application/json", status_code=200)

    except Exception as exc:
        logging.exception("Error querying ADX")
        body = json.dumps({"error": str(exc)})
        return func.HttpResponse(body, mimetype="application/json", status_code=500)

