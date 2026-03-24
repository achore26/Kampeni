FROM python:3.11-slim

WORKDIR /app

COPY shared/ ./shared/

COPY services/sentiment/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/sentiment/app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
