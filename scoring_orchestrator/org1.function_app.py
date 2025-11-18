# function_app.py — Azure Functions (Python) with ADX ingest + live query + health

import json
import logging
import os
from typing import Any, Dict
from datetime import datetime, timezone, timedelta

import azure.functions as func
import requests
from azure.identity import DefaultAzureCredential
from azure.kusto.data import (
    KustoClient,
    KustoConnectionStringBuilder,
    ClientRequestProperties,
)

# ---------------- App (one instance only) ----------------
app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# ---------------- Config ----------------
KUSTO_INGEST_URI   = os.environ.get("KUSTO_INGEST_URI")                  # e.g. https://ingest-aix-dts.eastus2.kusto.windows.net
KUSTO_DATA_URI     = os.environ.get("KUSTO_DATA_URI")                    # e.g. https://aix-dts.eastus2.kusto.windows.net
ADX_DB             = os.environ.get("ADX_DATABASE", "aixdb")
ADX_TABLE          = os.environ.get("ADX_TABLE", "aix_scores_v2")
ADX_MAPPING        = os.environ.get("ADX_MAPPING", "aix_scores_json_map")

# MS scopes
KUSTO_INGEST_SCOPE = "https://ingest.kusto.windows.net/.default"
KUSTO_DATA_SCOPE   = "https://kusto.kusto.windows.net/.default"

LATEST_CACHE_PATH  = "/tmp/tech_health_latest.json"
_cred = DefaultAzureCredential()

# ---------------- Helpers ----------------
def _get_ingest_token() -> str:
    return _cred.get_token(KUSTO_INGEST_SCOPE).token

def _kusto_query_client() -> KustoClient:
    if not KUSTO_DATA_URI:
        raise RuntimeError("KUSTO_DATA_URI is not set")
    def _tp(): return _cred.get_token(KUSTO_DATA_SCOPE).token
    kcsb = KustoConnectionStringBuilder.with_token_provider(KUSTO_DATA_URI, _tp)
    return KustoClient(kcsb)

def _level_from_score(score: float) -> str:
    if score >= 401: return "Leading"
    if score >= 301: return "Advanced"
    if score >= 201: return "Developing"
    if score >= 101: return "Initial"
    return "Not Started"

def _validate(payload: Dict[str, Any]) -> None:
    required = [
        "session_id","assessment_type","timestamp","customer","industry",
        "participant_name","participant_role","org","domains","overall_score_500","notes"
    ]
    missing = [k for k in required if k not in payload]
    if missing:
        raise ValueError(f"Missing fields: {', '.join(missing)}")
    if not isinstance(payload["domains"], list):
        raise ValueError("domains must be an array")
    for d in payload["domains"]:
        if not isinstance(d, dict) or "name" not in d or "score" not in d:
            raise ValueError("each domain must be an object with 'name' and 'score'")

def _write_latest_cache(body: Dict[str, Any]) -> None:
    score = float(body.get("overall_score_500", 0) or 0)
    ts = str(body.get("timestamp") or datetime.now(timezone.utc).isoformat())
    latest = {"score": int(score), "max": 500, "level": _level_from_score(score), "timestamp": ts}
    with open(LATEST_CACHE_PATH, "w") as f:
        json.dump(latest, f)

def _normalize_iso_z(s: str) -> datetime:
    if not s:
        raise ValueError("timestamp is required")
    s = s.replace("Z", "+00:00")
    return datetime.fromisoformat(s).astimezone(timezone.utc)

def _build_row(payload: Dict[str, Any]) -> Dict[str, Any]:
    utc_dt = _normalize_iso_z(payload["timestamp"])
    ist_dt = utc_dt + timedelta(minutes=330)
    return {
        "session_id": payload["session_id"],
        "assessment_type": payload["assessment_type"],
        "timestamp_utc": utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "timestamp_local_ist": ist_dt.strftime("%Y-%m-%dT%H:%M:%S+05:30"),
        "customer": payload["customer"],
        "industry": payload.get("industry", "") or "",
        "participant_name": payload["participant_name"],
        "participant_role": payload["participant_role"],
        "org": payload["org"],
        "domains": payload["domains"],
        "overall_score_500": payload.get("overall_score_500"),
        "notes": payload.get("notes", ""),
        "received_at_utc": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

# ---------------- Routes ----------------

# Health ping
@app.function_name("ping")
@app.route(route="ping", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def ping(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("OK", status_code=200)

# Readiness/health with Kusto ping
@app.function_name("health")
@app.route(route="health", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def health(req: func.HttpRequest) -> func.HttpResponse:
    payload = {"status": "ok", "kusto": "skipped"}
    try:
        if KUSTO_DATA_URI:
            client = _kusto_query_client()
            result = client.execute_query(ADX_DB, "print 1")
            _ = list(result.primary_results[0])[0][0]
            payload["kusto"] = "ok"
    except Exception as ex:
        payload["kusto"] = f"error: {str(ex)}"
        return func.HttpResponse(json.dumps(payload), status_code=500, mimetype="application/json")
    return func.HttpResponse(json.dumps(payload), status_code=200, mimetype="application/json")

# POST /api/score_and_push  (FUNCTION key) — ingest + update cache
@app.function_name("score_and_push")
@app.route(route="score_and_push", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def score_and_push(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)
    try:
        _validate(body)
    except Exception as e:
        return func.HttpResponse(str(e), status_code=400)

    # Update local cache (best-effort)
    try:
        _write_latest_cache(body)
    except Exception:
        logging.exception("Failed to write latest cache")

    # Shape row for ADX
    try:
        row = _build_row(body)
    except Exception as e:
        return func.HttpResponse(f"Timestamp/shape error: {e}", status_code=400)

    # Allow success in dev when no ingest URI
    if not KUSTO_INGEST_URI:
        return func.HttpResponse("Accepted (no KUSTO_INGEST_URI; cache updated)", status_code=200)

    ingest_url = (
        f"{KUSTO_INGEST_URI}/v1/rest/ingest/{ADX_DB}/{ADX_TABLE}"
        f"?streamFormat=json&mappingName={ADX_MAPPING}"
    )
    event_bytes = (json.dumps(row) + "\n").encode("utf-8")

    try:
        token = _get_ingest_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json; charset=utf-8"}
        resp = requests.post(ingest_url, headers=headers, data=event_bytes, timeout=30)
        if resp.status_code not in (200, 202):
            logging.error("ADX ingest failed: %s %s", resp.status_code, resp.text)
            return func.HttpResponse(f"ADX ingest error: {resp.text}", status_code=502)
        return func.HttpResponse("Accepted", status_code=200)
    except Exception as e:
        logging.exception("Ingest exception")
        return func.HttpResponse(f"Exception: {e}", status_code=500)

# GET /api/tech_health_latest  (cache; ANONYMOUS)
@app.function_name("tech_health_latest")
@app.route(route="tech_health_latest", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def tech_health_latest_get(req: func.HttpRequest) -> func.HttpResponse:
    try:
        if os.path.exists(LATEST_CACHE_PATH):
            with open(LATEST_CACHE_PATH, "r") as f:
                payload = f.read()
        else:
            payload = json.dumps({"score": 0, "max": 500, "level": "", "timestamp": ""})
        return func.HttpResponse(payload, mimetype="application/json", status_code=200)
    except Exception as e:
        logging.exception("latest read error")
        return func.HttpResponse(json.dumps({"error": str(e)}), mimetype="application/json", status_code=500)

# GET /api/tech_health_latest_live?customer=&participant=  (queries ADX; ANONYMOUS)
@app.function_name("tech_health_latest_live")
@app.route(route="tech_health_latest_live", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def tech_health_latest_live(req: func.HttpRequest) -> func.HttpResponse:
    try:
        customer = (req.params.get("customer") or "").strip()
        participant = (req.params.get("participant") or "").strip()

        query = f"""
declare query_parameters(p_customer:string = "", p_participant:string = "");
{ADX_TABLE}
| where (p_customer == "" or customer == p_customer)
| where (p_participant == "" or participant_name == p_participant)
| where isnotempty(timestamp_utc)
| top 1 by timestamp_utc desc
| project overall_score_500, timestamp_utc
"""
        props = ClientRequestProperties()
        props.set_parameter("p_customer", customer)
        props.set_parameter("p_participant", participant)

        client = _kusto_query_client()
        resp = client.execute_query(ADX_DB, query, props)
        rows = [dict(r) for r in resp.primary_results[0]] if resp.primary_results else []

        if not rows:
            return func.HttpResponse(
                json.dumps({"score": 0, "max": 500, "level": "", "timestamp": ""}),
                status_code=200, mimetype="application/json"
            )

        r = rows[0]
        score = int(r.get("overall_score_500") or 0)
        level = _level_from_score(score)
        return func.HttpResponse(
            json.dumps({"score": score, "max": 500, "level": level, "timestamp": str(r.get("timestamp_utc"))}),
            mimetype="application/json", status_code=200
        )
    except Exception as ex:
        logging.exception("live latest error")
        return func.HttpResponse(json.dumps({"error": str(ex)}), mimetype="application/json", status_code=500)

# Reuse POST for tests
@app.function_name("test_score_and_push")
@app.route(route="test_score_and_push", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def test_score_and_push(req: func.HttpRequest) -> func.HttpResponse:
    return score_and_push(req)

