FROM prefecthq/prefect:3-latest

WORKDIR /flows

COPY flows/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY flows/ .

CMD ["python", "serve.py"]
