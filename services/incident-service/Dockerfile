FROM python:3.12-slim

RUN adduser --disabled-password --gecos "" --uid 65532 nonroot

RUN python -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir --ignore-installed "setuptools>=69" && \
    python -c "import pkg_resources; print('setuptools OK')" && \
    pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
RUN chown -R 65532:65532 /app

USER 65532:65532

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
