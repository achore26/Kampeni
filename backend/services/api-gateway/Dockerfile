FROM python:3.11-slim

WORKDIR /app

COPY backend/shared/ ./shared/

# Install shared + service requirements together in one pip call
# (fewer network round trips, handles dependency conflicts better)
COPY backend/shared/requirements.txt ./shared_requirements.txt
COPY backend/services/api-gateway/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --timeout 120 -r shared_requirements.txt -r requirements.txt

COPY backend/services/api-gateway/app/ ./app/
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
