# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM python:3.12-slim

RUN adduser --disabled-password --gecos "" --uid 65532 nonroot

COPY --from=builder /install /usr/local

WORKDIR /app
COPY app/ ./app/

USER 65532:65532

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
