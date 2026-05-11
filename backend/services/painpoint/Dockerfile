FROM python:3.11-slim

WORKDIR /app

COPY shared/ ./shared/

# Install shared + service requirements together in one pip call
# (fewer network round trips, handles dependency conflicts better)
COPY shared/requirements.txt ./shared_requirements.txt
COPY services/painpoint/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --timeout 120 -r shared_requirements.txt -r requirements.txt

COPY services/painpoint/app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8006"]
