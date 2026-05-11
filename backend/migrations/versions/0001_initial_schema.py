"""Initial schema — all MVP tables.

Revision ID: 0001
Revises:
Create Date: 2026-04-17
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── articles ─────────────────────────────────────────────────────────────
    op.create_table(
        "articles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("url", sa.String(2048), nullable=False, unique=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column("source", sa.String(64), nullable=False),
        sa.Column("author", sa.String(256), nullable=True),
        sa.Column("language", sa.String(8), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_articles_source", "articles", ["source"])
    op.create_index("ix_articles_published_at", "articles", ["published_at"])

    # ── sentiment_records ─────────────────────────────────────────────────────
    op.create_table(
        "sentiment_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "article_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(16), nullable=False),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("language_detected", sa.String(8), nullable=False),
        sa.Column(
            "classifier_version",
            sa.String(32),
            nullable=False,
            server_default="vader-v1",
        ),
        sa.Column("candidate_id", sa.String(128), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_sentiment_article_id", "sentiment_records", ["article_id"])
    op.create_index("ix_sentiment_candidate_id", "sentiment_records", ["candidate_id"])
    op.create_index("ix_sentiment_label", "sentiment_records", ["label"])

    # ── opponent_profiles ─────────────────────────────────────────────────────
    op.create_table(
        "opponent_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("aliases", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("constituency", sa.String(256), nullable=False),
        sa.Column("party", sa.String(128), nullable=True),
        sa.Column("position", sa.String(64), nullable=True),
        sa.Column("is_incumbent", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("twitter_handle", sa.String(64), nullable=True),
        sa.Column("candidate_id", sa.String(128), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_opponent_profiles_candidate_id", "opponent_profiles", ["candidate_id"])

    # ── opponent_mentions ─────────────────────────────────────────────────────
    op.create_table(
        "opponent_mentions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "opponent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("opponent_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "article_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("context", sa.Text, nullable=False),
        sa.Column(
            "mention_type",
            sa.String(16),
            nullable=False,
            server_default="body",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_mentions_opponent_id", "opponent_mentions", ["opponent_id"])
    op.create_index("ix_mentions_article_id", "opponent_mentions", ["article_id"])
    op.create_index("ix_mentions_created_at", "opponent_mentions", ["created_at"])

    # ── field_report_records ──────────────────────────────────────────────────
    op.create_table(
        "field_report_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("agent_id", sa.String(255), nullable=False),
        sa.Column("ward", sa.String(255), nullable=False),
        sa.Column("report_type", sa.String(50), nullable=False),
        sa.Column("top_issue", sa.String(50), nullable=False),
        sa.Column("support_level", sa.String(50), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_field_reports_ward", "field_report_records", ["ward"])
    op.create_index("ix_field_reports_created_at", "field_report_records", ["created_at"])

    # ── pain_points ───────────────────────────────────────────────────────────
    op.create_table(
        "pain_points",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("issue_category", sa.String(64), nullable=False),
        sa.Column("issue_description", sa.Text, nullable=False),
        sa.Column(
            "severity",
            sa.String(16),
            nullable=False,
            server_default="medium",
        ),
        sa.Column("location_name", sa.String(256), nullable=True),
        sa.Column("county", sa.String(128), nullable=True),
        sa.Column("constituency", sa.String(128), nullable=True),
        sa.Column("politicians_mentioned", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("source_language", sa.String(8), nullable=True),
        sa.Column("confidence", sa.Float, nullable=False, server_default="0.0"),
        sa.Column(
            "used_mock",
            sa.Boolean,
            nullable=False,
            server_default="false",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_pain_points_issue_category", "pain_points", ["issue_category"])
    op.create_index("ix_pain_points_county", "pain_points", ["county"])
    op.create_index("ix_pain_points_created_at", "pain_points", ["created_at"])
    op.create_index("ix_pain_points_article_id", "pain_points", ["article_id"])


def downgrade() -> None:
    op.drop_table("pain_points")
    op.drop_table("field_report_records")
    op.drop_table("opponent_mentions")
    op.drop_table("opponent_profiles")
    op.drop_table("sentiment_records")
    op.drop_table("articles")
