"""Prefect flow server — registers all flows and their schedules.

This is the entry point for the prefect-worker container.
Connects to the Prefect server and registers scheduled deployments.

Schedule overview:
  news-pipeline           → every 30 minutes (ingestion → sentiment → translation)
  social-pipeline         → every 60 minutes (Facebook pages + forager → translation)
  translation-pipeline    → every 2 minutes  (drain translate queue)
  painpoint-pipeline      → every 2 minutes  (drain painpoint queue)
  opponent-pipeline       → every 10 minutes (scan for opponent mentions)
  field-reports-pipeline  → every 5 minutes  (drain field reports queue)
  daily-briefing-gen      → 5am EAT (2am UTC) daily
  daily-briefing-del      → 6am EAT (3am UTC) daily

Prefect is the single source of scheduling truth. All services run tasks
synchronously — no Celery workers, no Celery Beat.

To manually trigger any flow: Prefect UI → http://localhost:4200 → Quick Run.
"""
from prefect import serve

from news_pipeline import news_pipeline
from social_pipeline import social_pipeline
from translation_pipeline import translation_pipeline
from painpoint_pipeline import painpoint_pipeline
from opponent_pipeline import opponent_pipeline
from field_reports_pipeline import field_reports_pipeline
from daily_briefing import daily_briefing_generate, daily_briefing_deliver


if __name__ == "__main__":
    serve(
        # Every 30 minutes — Nation, Standard, Citizen, CapitalFM, KBC, YouTube
        news_pipeline.to_deployment(
            name="news-pipeline",
            cron="*/30 * * * *",
            description="Scrape RSS feeds + YouTube → sentiment → translation",
        ),
        # Every 60 minutes — Facebook public pages + keyword forager
        social_pipeline.to_deployment(
            name="social-pipeline",
            cron="0 * * * *",
            description="Facebook page scraper + political/painpoint keyword forager → translation",
        ),
        # Every 2 minutes — drain translation queue (non-EN/SW articles)
        translation_pipeline.to_deployment(
            name="translation-pipeline",
            cron="*/2 * * * *",
            description="Translate non-EN/SW articles and push to painpoint queue",
        ),
        # Every 2 minutes — drain painpoint queue (AI issue extraction)
        painpoint_pipeline.to_deployment(
            name="painpoint-pipeline",
            cron="*/2 * * * *",
            description="Extract civic pain points from translated articles",
        ),
        # Every 10 minutes — scan recent articles for opponent mentions
        opponent_pipeline.to_deployment(
            name="opponent-pipeline",
            cron="*/10 * * * *",
            description="Scan articles for registered opponent mentions",
        ),
        # Every 5 minutes — field agent reports from Redis → Postgres
        field_reports_pipeline.to_deployment(
            name="field-reports-pipeline",
            cron="*/5 * * * *",
            description="Flush pending field agent reports from Redis into Postgres",
        ),
        # 5am EAT = 2am UTC
        daily_briefing_generate.to_deployment(
            name="daily-briefing-generate",
            cron="0 2 * * *",
            description="Generate AI briefings for all active candidates (5am EAT)",
        ),
        # 6am EAT = 3am UTC
        daily_briefing_deliver.to_deployment(
            name="daily-briefing-deliver",
            cron="0 3 * * *",
            description="Deliver approved briefings to candidates (6am EAT)",
        ),
    )
