from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class CandidateConfig(Base):
    """Per-candidate watchlist — drives pipeline attribution and data scoping."""
    __tablename__ = "candidate_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Slug used everywhere as the scoping key (e.g. "sakaja-001")
    candidate_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(256), nullable=False)
    # Name variations used for keyword matching in ingested articles
    name_variations: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    county: Mapped[str] = mapped_column(String(128), nullable=False)
    constituency: Mapped[str | None] = mapped_column(String(128), nullable=True)
    # Additional keywords to watch beyond name variations (issues, locations, etc.)
    keywords: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="sw")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
