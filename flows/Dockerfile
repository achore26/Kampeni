FROM prefecthq/prefect:3-latest

WORKDIR /flows

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "serve.py"]
