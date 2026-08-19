from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class PainPoint(Base):
    __tablename__ = "pain_points"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )

    # Extracted issue data
    issue_category: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g. "water", "roads", "health"
    issue_description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")  # low / medium / high

    # Location
    location_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    county: Mapped[str | None] = mapped_column(String(128), nullable=True)
    constituency: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Politicians mentioned
    politicians_mentioned: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # Candidate scoping — which candidate's pipeline extracted this
    candidate_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)

    # Meta
    source_language: Mapped[str | None] = mapped_column(String(8), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    used_mock: Mapped[bool] = mapped_column(nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_pain_points_issue_category", "issue_category"),
        Index("ix_pain_points_county", "county"),
        Index("ix_pain_points_created_at", "created_at"),
    )
