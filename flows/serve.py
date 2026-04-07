"""Prefect flow server — runs all flows and registers their schedules.

This is the entry point for the prefect-worker container.
It connects to the Prefect server and registers 4 scheduled deployments:

  news-pipeline         → every 30 minutes
  field-reports         → every 5 minutes
  daily-briefing-gen    → 5am EAT (2am UTC) daily
  daily-briefing-del    → 6am EAT (3am UTC) daily

To manually trigger any flow, open the Prefect UI at http://localhost:4200,
find the deployment, and click "Quick Run".
"""
import asyncio

from prefect import serve

from news_pipeline import news_pipeline
from field_reports_pipeline import field_reports_pipeline
from daily_briefing import daily_briefing_generate, daily_briefing_deliver


async def main() -> None:
    await serve(
        # Every 30 minutes
        news_pipeline.to_deployment(
            name="news-pipeline",
            cron="*/30 * * * *",
            description="Scrape Nation/Standard/Citizen RSS → classify sentiment",
        ),
        # Every 5 minutes
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


if __name__ == "__main__":
    asyncio.run(main())
