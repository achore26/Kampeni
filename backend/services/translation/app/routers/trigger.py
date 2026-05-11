"""Internal trigger endpoint — called by Prefect after sentiment completes.

Flow sequence:
  Prefect → POST /trigger/translate
  → service pops items from articles:translate:pending, translates, pushes to painpoint queue
"""
from fastapi import APIRouter, Depends

from shared.internal_auth import require_internal_secret
from app.tasks import process_pending_translations

router = APIRouter(prefix="/trigger", tags=["trigger"], dependencies=[Depends(require_internal_secret)])


@router.post("/translate")
def trigger_translation() -> dict:
    """Run a translation batch synchronously."""
    result = process_pending_translations()
    return {"status": "done", **result}
