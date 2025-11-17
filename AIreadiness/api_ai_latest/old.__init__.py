import logging
import azure.functions as func
import json
from azure.kusto.data import KustoConnectionStringBuilder, Clients
from azure.kusto.data.exceptions import KustoServiceError

def main(req: func.HttpRequest) -> func.HttpResponse:
    cluster = "https://aix-dts.eastus2.kusto.windows.net"
    db = "aixdb"

    kcsb = KustoConnectionStringBuilder.with_aad_managed_service_identity(
        cluster
    )

    client = Clients.KustoClient(kcsb)

    query = """
    AIReadinessLatest
    | project timestamp, customer, participant_name, total_105, percent, level, maturity
    | order by timestamp desc
    | take 1
    """

    try:
        resp = client.execute(db, query)
        rows = [
            dict(zip([col.column_name for col in resp.primary_results.columns], row))
            for row in resp.primary_results.rows
        ]
        return func.HttpResponse(json.dumps(rows[0]), mimetype="application/json")

    except KustoServiceError as e:
        return func.HttpResponse(str(e), status_code=500)

