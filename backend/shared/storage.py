"""Object storage client — MinIO locally, S3 in production.

Swap MINIO_ENDPOINT to your S3 endpoint and update credentials in .env
to move from MinIO to AWS S3 with zero code changes.

Bucket layout:
  kampeni-raw/
    articles/{source}/{YYYY}/{MM}/{DD}/{article_id}.json   — raw scraped articles
    translations/{article_id}.json                         — translated versions
    field-reports/{YYYY}/{MM}/{DD}/{report_id}.json        — raw field reports
    social/{platform}/{YYYY}/{MM}/{DD}/{post_id}.json      — social media posts (Phase 2)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from .config import get_settings

logger = logging.getLogger(__name__)


def _client():
    settings = get_settings()
    # When MINIO_ENDPOINT is blank, we're on AWS — use the IAM task role (no keys needed).
    # When it's set, we're local and need explicit MinIO credentials.
    if settings.minio_endpoint:
        return boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
    return boto3.client("s3")


def ensure_bucket() -> None:
    """Create the raw bucket if it doesn't exist. Safe to call repeatedly."""
    settings = get_settings()
    client = _client()
    try:
        client.head_bucket(Bucket=settings.minio_bucket)
    except ClientError as e:
        if e.response["Error"]["Code"] in ("404", "NoSuchBucket"):
            client.create_bucket(Bucket=settings.minio_bucket)
            logger.info("Created bucket: %s", settings.minio_bucket)
        else:
            raise


def put_object(key: str, data: dict[str, Any]) -> str:
    """Store a JSON object. Returns the full key."""
    settings = get_settings()
    client = _client()
    client.put_object(
        Bucket=settings.minio_bucket,
        Key=key,
        Body=json.dumps(data, default=str).encode(),
        ContentType="application/json",
    )
    return key


def get_object(key: str) -> dict[str, Any]:
    """Retrieve a JSON object by key."""
    settings = get_settings()
    client = _client()
    response = client.get_object(Bucket=settings.minio_bucket, Key=key)
    return json.loads(response["Body"].read())


def article_key(source: str, article_id: str, dt: datetime | None = None) -> str:
    """Canonical key for a raw article."""
    d = dt or datetime.now(timezone.utc)
    return f"articles/{source}/{d.year}/{d.month:02d}/{d.day:02d}/{article_id}.json"


def translation_key(article_id: str) -> str:
    """Canonical key for a translated article."""
    return f"translations/{article_id}.json"


def field_report_key(report_id: str, dt: datetime | None = None) -> str:
    """Canonical key for a raw field report."""
    d = dt or datetime.now(timezone.utc)
    return f"field-reports/{d.year}/{d.month:02d}/{d.day:02d}/{report_id}.json"
