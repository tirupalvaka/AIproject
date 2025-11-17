# /functions/score_and_push_ai_readiness/__init__.py
import json, datetime, os
import azure.functions as func
from azure.kusto.ingest import KustoIngestClient, IngestionProperties, DataFormat
from azure.kusto.data import KustoConnectionStringBuilder

CLUSTER = os.environ["ADX_CLUSTER"]         # e.g. "https://<cluster>.kusto.windows.net"
DB      = os.environ["ADX_DB"]              # e.g. "aix-dts"
TABLE   = "ai_readiness_scores"

def score_to_level(total: int):
    if total >= 85:  return 5, "Leading"
    if total >= 64:  return 4, "Advanced"
    if total >= 43:  return 3, "Developing"
    if total >= 22:  return 2, "Initial"
    return 1, "Not Started"

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
        # expected body
        # {
        #   "session_id": "...",
        #   "customer": "...",
        #   "industry": "...",
        #   "participant_name": "...",
        #   "participant_role": "...",
        #   "org": "...",
        #   "answers": [21 integers between 1 and 5],
        #   "notes": "..."
        # }

        answers = body.get("answers", [])
        if not isinstance(answers, list) or len(answers) != 21:
            return func.HttpResponse("answers must be an array of 21 integers (1..5)", status_code=400)

        total = sum(int(x) for x in answers)
        level, maturity = score_to_level(total)
        percent = round(total / 105.0 * 100.0, 2)

        row = {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "session_id": body.get("session_id", ""),
            "customer": body.get("customer", ""),
            "industry": body.get("industry", ""),
            "participant_name": body.get("participant_name", ""),
            "participant_role": body.get("participant_role", ""),
            "org": body.get("org", ""),
            "answers": answers,
            "total_105": total,
            "percent": percent,
            "level": level,
            "maturity": maturity,
            "notes": body.get("notes", "")
        }

        # Ingest to ADX
        kcsb = KustoConnectionStringBuilder.with_aad_managed_service_identity(CLUSTER)
        ingest = KustoIngestClient(kcsb)
        props = IngestionProperties(
            database=DB,
            table=TABLE,
            data_format=DataFormat.JSON
        )
        ingest.ingest_from_dataframe(None)  # optional path
        # For simplicity, use JSON row ingestion:
        ingest.ingest_from_stream(
            io.StringIO(json.dumps(row) + "\n"),
            ingestion_properties=props
        )

        return func.HttpResponse(json.dumps({"ok": True, "total_105": total, "level": level, "maturity": maturity}), status_code=202, mimetype="application/json")
    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)

