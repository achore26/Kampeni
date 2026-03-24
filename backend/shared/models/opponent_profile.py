from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class OpponentProfile(Base):
    """A political opponent being monitored for a client."""

    __tablename__ = "opponent_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    aliases: Mapped[list[str] | None] = mapped_column(
        ARRAY(String),
        nullable=True,
        comment="Alternative names/nicknames to search for",
    )
    constituency: Mapped[str] = mapped_column(String(256), nullable=False)
    party: Mapped[str | None] = mapped_column(String(128), nullable=True)
    position: Mapped[str | None] = mapped_column(
        String(64), nullable=True, comment="MP | MCA | Governor | Senator"
    )
    is_incumbent: Mapped[bool] = mapped_column(Boolean, default=False)
    twitter_handle: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Which client (candidate) this opponent is being tracked for
    candidate_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
