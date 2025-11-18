# function_app.py — Azure Functions Python v2 (CLEAN)

import json
import logging
import os
from typing import Any, Dict
from datetime import datetime, timezone, timedelta

import azure.functions as func
import requests
from azure.identity import DefaultAzureCredential

# ---------------- App (one instance only) ----------------
app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# ---------------- Config ----------------
KUSTO_INGEST_URI   = os.environ.get("KUSTO_INGEST_URI")                 # e.g. https://aix-dts.ingest.eastus2.kusto.windows.net
ADX_DB             = os.environ.get("ADX_DATABASE", "aixdb")
ADX_TABLE          = os.environ.get("ADX_TABLE", "aix_scores_v2")       # change to aix_scores if you use v1
ADX_MAPPING        = os.environ.get("ADX_MAPPING", "aix_scores_json_map")
KUSTO_INGEST_SCOPE = "https://ingest.kusto.windows.net/.default"

LATEST_CACHE_PATH  = "/tmp/tech_health_latest.json"
_cred = DefaultAzureCredential()

# ---------------- Helpers ----------------
def _get_token() -> str:
    return _cred.get_token(KUSTO_INGEST_SCOPE).token

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

# Health check
@app.function_name("ping")
@app.route(route="ping", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def ping(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("OK", status_code=200)

# POST /api/score_and_push  (FUNCTION key)
@app.function_name("score_and_push")
@app.route(route="score_and_push", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def score_and_push(req: func.HttpRequest) -> func.HttpResponse:
    # Parse JSON
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    # Validate contract
    try:
        _validate(body)
    except Exception as e:
        return func.HttpResponse(str(e), status_code=400)

    # Update local "latest" cache for quick UI reads
    try:
        _write_latest_cache(body)
    except Exception:
        logging.exception("Failed to write latest cache")

    # Normalize timestamps / shape row for ADX
    try:
        row = _build_row(body)
    except Exception as e:
        return func.HttpResponse(f"Timestamp/shape error: {e}", status_code=400)

    # Allow local/dev success with no ADX configured
    if not KUSTO_INGEST_URI:
        return func.HttpResponse("Accepted (no KUSTO_INGEST_URI; cache updated)", status_code=200)

    # Ingest to ADX
    ingest_url = (
        f"{KUSTO_INGEST_URI}/v1/rest/ingest/{ADX_DB}/{ADX_TABLE}"
        f"?streamFormat=json&mappingName={ADX_MAPPING}"
    )
    event_bytes = (json.dumps(row) + "\n").encode("utf-8")

    try:
        token = _get_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json; charset=utf-8"}
        resp = requests.post(ingest_url, headers=headers, data=event_bytes, timeout=30)
        if resp.status_code not in (200, 202):
            logging.error("ADX ingest failed: %s %s", resp.status_code, resp.text)
            return func.HttpResponse(f"ADX ingest error: {resp.text}", status_code=502)
        return func.HttpResponse("Accepted", status_code=200)
    except Exception as e:
        logging.exception("Ingest exception")
        return func.HttpResponse(f"Exception: {e}", status_code=500)

# GET /api/tech_health_latest  (ANONYMOUS)
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

# For integration tests – reuses score_and_push
@app.function_name("test_score_and_push")
@app.route(route="test_score_and_push", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def test_score_and_push(req: func.HttpRequest) -> func.HttpResponse:
    return score_and_push(req)

