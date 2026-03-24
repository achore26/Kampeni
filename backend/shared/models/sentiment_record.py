from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class SentimentRecord(Base):
    __tablename__ = "sentiment_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
    )
    label: Mapped[str] = mapped_column(String(16), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    language_detected: Mapped[str] = mapped_column(String(8), nullable=False)
    classifier_version: Mapped[str] = mapped_column(
        String(32), nullable=False, default="vader-v1"
    )
    candidate_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_sentiment_article_id", "article_id"),
        Index("ix_sentiment_candidate_id", "candidate_id"),
        Index("ix_sentiment_label", "label"),
    )
