FROM python:3.12-slim

RUN adduser --disabled-password --gecos "" --uid 65532 nonroot

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir setuptools && \
    pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

USER 65532:65532

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
