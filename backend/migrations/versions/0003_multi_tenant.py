"""Multi-tenant: candidate_configs table + candidate_id on pain_points and field_report_records.

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-06
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── candidate_configs ─────────────────────────────────────────────────────
    op.create_table(
        "candidate_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("candidate_id", sa.String(128), nullable=False, unique=True),
        sa.Column("display_name", sa.String(256), nullable=False),
        sa.Column("name_variations", postgresql.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("county", sa.String(128), nullable=False),
        sa.Column("constituency", sa.String(128), nullable=True),
        sa.Column("keywords", postgresql.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("language", sa.String(8), nullable=False, server_default="sw"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_candidate_configs_candidate_id", "candidate_configs", ["candidate_id"])
    op.create_index("ix_candidate_configs_is_active", "candidate_configs", ["is_active"])

    # ── pain_points — add candidate_id ────────────────────────────────────────
    op.add_column("pain_points", sa.Column("candidate_id", sa.String(128), nullable=True))
    op.create_index("ix_pain_points_candidate_id", "pain_points", ["candidate_id"])

    # ── field_report_records — add candidate_id ───────────────────────────────
    op.add_column("field_report_records", sa.Column("candidate_id", sa.String(128), nullable=True))
    op.create_index("ix_field_reports_candidate_id", "field_report_records", ["candidate_id"])


def downgrade() -> None:
    op.drop_index("ix_field_reports_candidate_id", "field_report_records")
    op.drop_column("field_report_records", "candidate_id")
    op.drop_index("ix_pain_points_candidate_id", "pain_points")
    op.drop_column("pain_points", "candidate_id")
    op.drop_table("candidate_configs")
