"""Add briefings table.

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-19
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "briefings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("candidate_id", sa.String(255), nullable=False),
        sa.Column("briefing_date", sa.Date, nullable=False),
        sa.Column("language", sa.String(8), nullable=False, server_default="sw"),
        # JSONB: list of {title, content} dicts — one per section
        sa.Column("sections", postgresql.JSONB, nullable=False, server_default="[]"),
        # Raw context passed to GPT-4o — stored for auditability
        sa.Column("raw_context", postgresql.JSONB, nullable=True),
        # Approval gate — Political Director must approve before 6am delivery
        sa.Column("is_approved", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("approved_by", sa.String(255), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        # Delivery tracking
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_channels", postgresql.ARRAY(sa.String), nullable=True),
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
    op.create_index("ix_briefings_candidate_id", "briefings", ["candidate_id"])
    op.create_index("ix_briefings_briefing_date", "briefings", ["briefing_date"])
    op.create_unique_constraint(
        "uq_briefings_candidate_date",
        "briefings",
        ["candidate_id", "briefing_date"],
    )


def downgrade() -> None:
    op.drop_table("briefings")
