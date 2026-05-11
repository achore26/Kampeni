"""Internal trigger endpoint — called by Prefect periodically.

Flow sequence:
  Prefect → POST /trigger/scan
  → service scans recent articles for opponent mentions, stores to Postgres
"""
from fastapi import APIRouter, Depends

from shared.internal_auth import require_internal_secret
from app.tasks import scan_articles_for_opponents

router = APIRouter(prefix="/trigger", tags=["trigger"], dependencies=[Depends(require_internal_secret)])


@router.post("/scan")
def trigger_opponent_scan() -> dict:
    """Scan recent articles for opponent mentions synchronously."""
    result = scan_articles_for_opponents()
    return {"status": "done", **result}
