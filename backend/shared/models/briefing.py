from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    briefing_date: Mapped[date] = mapped_column(Date, nullable=False)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="sw")

    # Generated content — list of {title, content} dicts
    sections: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Raw context fed to GPT-4o (kept for audit/debugging)
    raw_context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Political Director approval gate before 6am delivery
    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    approved_by: Mapped[str | None] = mapped_column(String(256), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Was this generated with mock/fallback data (no live articles)?
    used_mock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Delivery tracking
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_channels: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_briefings_candidate_date", "candidate_id", "briefing_date", unique=True),
    )
