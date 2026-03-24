from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    url: Mapped[str] = mapped_column(String(2048), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    author: Mapped[str | None] = mapped_column(String(256), nullable=True)
    language: Mapped[str | None] = mapped_column(String(8), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_articles_source", "source"),
        Index("ix_articles_published_at", "published_at"),
    )
