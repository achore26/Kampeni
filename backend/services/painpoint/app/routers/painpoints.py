"""Pain points API router — serves aggregated issue data to the frontend."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from shared.database import SyncSessionLocal
from shared.models import PainPoint

router = APIRouter(prefix="/painpoints", tags=["painpoints"])


def get_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def summary(
    candidate_id: str | None = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    """Aggregated pain point counts by category, scoped to a candidate."""
    q = db.query(PainPoint.issue_category, func.count(PainPoint.id))
    if candidate_id:
        q = q.filter(PainPoint.candidate_id == candidate_id)
    rows = q.group_by(PainPoint.issue_category).order_by(func.count(PainPoint.id).desc()).all()
    return {
        "by_category": [{"category": r[0], "count": r[1]} for r in rows],
        "total": sum(r[1] for r in rows),
    }


@router.get("/by-county")
def by_county(
    candidate_id: str | None = Query(None),
    db: Session = Depends(get_db),
) -> list:
    """Pain point counts grouped by county, scoped to a candidate."""
    q = (
        db.query(PainPoint.county, func.count(PainPoint.id))
        .filter(PainPoint.county.isnot(None))
    )
    if candidate_id:
        q = q.filter(PainPoint.candidate_id == candidate_id)
    rows = q.group_by(PainPoint.county).order_by(func.count(PainPoint.id).desc()).limit(20).all()
    return [{"county": r[0], "painpoint_count": r[1]} for r in rows]


@router.get("/")
def list_pain_points(
    candidate_id: str | None = Query(None),
    category: str | None = Query(None),
    county: str | None = Query(None),
    severity: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
) -> dict:
    q = db.query(PainPoint)
    if candidate_id:
        q = q.filter(PainPoint.candidate_id == candidate_id)
    if category:
        q = q.filter(PainPoint.issue_category == category)
    if county:
        q = q.filter(PainPoint.county == county)
    if severity:
        q = q.filter(PainPoint.severity == severity)

    total = q.count()
    items = q.order_by(PainPoint.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": str(p.id),
                "article_id": str(p.article_id),
                "category": p.issue_category,
                "description": p.issue_description,
                "severity": p.severity,
                "location": p.location_name,
                "county": p.county,
                "constituency": p.constituency,
                "politicians": p.politicians_mentioned or [],
                "confidence": p.confidence,
                "used_mock": p.used_mock,
                "created_at": p.created_at.isoformat(),
            }
            for p in items
        ],
    }
