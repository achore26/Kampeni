"""Seed Sakaja candidate config for demo.

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-05
"""
from __future__ import annotations

import uuid
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text("""
            INSERT INTO candidate_configs
                (id, candidate_id, display_name, name_variations, county, constituency, keywords, language, is_active)
            VALUES (
                :id,
                'sakaja-001',
                'Johnson Sakaja',
                ARRAY['Sakaja', 'Johnson Sakaja', 'Senator Sakaja'],
                'Nairobi',
                NULL,
                ARRAY['Nairobi Senator', 'Nairobi County', 'Sakaja Foundation'],
                'en',
                true
            )
            ON CONFLICT (candidate_id) DO NOTHING
        """).bindparams(id=uuid.uuid4())
    )


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM candidate_configs WHERE candidate_id = 'sakaja-001'")
    )
