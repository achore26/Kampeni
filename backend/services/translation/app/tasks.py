"""Translation tasks — pops pending articles from Redis, translates, stores back to MinIO.

Flow:
  Redis queue (articles:translate:pending)
    ↓
  Fetch raw object from MinIO
    ↓
  Detect language (if not already tagged)
    ↓
  Translate to English via TranslationEngine
    ↓
  Store translated version to MinIO (translations/{article_id}.json)
    ↓
  Push article_id to Redis queue (articles:painpoint:pending)
    ↓
  Pain point extraction service picks up
"""
from __future__ import annotations

import json
import logging

import redis as redis_sync

from shared import storage
from shared.config import get_settings

from .engine import TranslationEngine, SUPPORTED_LANGUAGES
from .worker import celery_app

logger = logging.getLogger(__name__)

REDIS_INPUT_KEY = "articles:translate:pending"
REDIS_OUTPUT_KEY = "articles:painpoint:pending"
BATCH_SIZE = 20


@celery_app.task
def process_pending_translations() -> dict:
    """Pop article IDs from Redis, translate raw content, push to pain point queue."""
    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)
    engine = TranslationEngine()

    processed = skipped = errors = 0

    for _ in range(BATCH_SIZE):
        item = r.lpop(REDIS_INPUT_KEY)
        if item is None:
            break

        try:
            payload = json.loads(item)
            article_id = payload["article_id"]
            raw_key = payload["raw_key"]
        except (json.JSONDecodeError, KeyError) as exc:
            logger.warning("Invalid translation queue item: %s — %s", item[:100], exc)
            errors += 1
            continue

        try:
            raw = storage.get_object(raw_key)
        except Exception as exc:
            logger.warning("Could not fetch raw object %s: %s", raw_key, exc)
            errors += 1
            continue

        language = raw.get("language_detected", "en")

        # Skip translation if already in a supported language
        if language in SUPPORTED_LANGUAGES:
            translation_record = {
                "article_id": article_id,
                "original_language": language,
                "translated_title": raw.get("title", ""),
                "translated_content": raw.get("content", ""),
                "confidence": 1.0,
                "used_mock": False,
                "translation_required": False,
            }
        else:
            title_result = engine.translate(raw.get("title", ""), language)
            content_result = engine.translate(raw.get("content", "")[:2000], language)

            translation_record = {
                "article_id": article_id,
                "original_language": language,
                "original_title": raw.get("title", ""),
                "original_content": raw.get("content", ""),
                "translated_title": title_result.translated,
                "translated_content": content_result.translated,
                "confidence": min(title_result.confidence, content_result.confidence),
                "used_mock": title_result.used_mock or content_result.used_mock,
                "translation_required": True,
            }

        try:
            t_key = storage.translation_key(article_id)
            storage.put_object(t_key, translation_record)
        except Exception as exc:
            logger.warning("Failed to store translation for %s: %s", article_id, exc)
            errors += 1
            continue

        # Push to pain point queue
        r.rpush(REDIS_OUTPUT_KEY, json.dumps({
            "article_id": article_id,
            "translation_key": storage.translation_key(article_id),
            "raw_key": raw_key,
            "language": language,
            "used_mock": translation_record.get("used_mock", False),
        }))

        processed += 1

    r.close()
    logger.info("Translation batch: processed=%d, skipped=%d, errors=%d", processed, skipped, errors)
    return {"processed": processed, "skipped": skipped, "errors": errors}


@celery_app.task
def enqueue_article_for_translation(article_id: str, raw_key: str) -> None:
    """Called by ingestion service to push a new article into the translation queue."""
    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)
    r.rpush(REDIS_INPUT_KEY, json.dumps({"article_id": article_id, "raw_key": raw_key}))
    r.close()
