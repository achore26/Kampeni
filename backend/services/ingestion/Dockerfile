FROM python:3.11-slim

WORKDIR /app

COPY shared/ ./shared/

# Install shared + service requirements together in one pip call
# (fewer network round trips, handles dependency conflicts better)
COPY shared/requirements.txt ./shared_requirements.txt
COPY services/ingestion/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --timeout 120 -r shared_requirements.txt -r requirements.txt

# Install Playwright + Chromium for Facebook scraping
# chromium deps need to be installed first on slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpangocairo-1.0-0 libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*
RUN playwright install chromium

COPY services/ingestion/app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
