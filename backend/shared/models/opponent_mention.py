from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class OpponentMention(Base):
    """A single mention of an opponent in a news article."""

    __tablename__ = "opponent_mentions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    opponent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("opponent_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
    )
    # The sentence containing the mention — evidence for the alert
    context: Mapped[str] = mapped_column(Text, nullable=False)
    # Where in the article: title or body
    mention_type: Mapped[str] = mapped_column(String(16), nullable=False, default="body")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_mentions_opponent_id", "opponent_id"),
        Index("ix_mentions_article_id", "article_id"),
        Index("ix_mentions_created_at", "created_at"),
    )
