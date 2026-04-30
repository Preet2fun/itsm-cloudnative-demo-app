FROM python:3.12-slim

RUN adduser --disabled-password --gecos "" --uid 65532 nonroot

RUN python -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .

# Install requirements first, then pin setuptools to 69.5.1 which still ships
# pkg_resources as a top-level module (setuptools 70+ removed it).
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir --force-reinstall "setuptools==69.5.1" && \
    python -c "import pkg_resources; print('pkg_resources OK')"

COPY app/ ./app/
RUN chown -R 65532:65532 /app

USER 65532:65532

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
