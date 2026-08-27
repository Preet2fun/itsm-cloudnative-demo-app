import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

from app import db, mq
from app.config import settings
from app.db import close_db, init_db
from app.router import router
from app.telemetry import setup_telemetry

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","service":"incident-service","message":"%(message)s"}',
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    setup_telemetry(settings.otel_service_name, settings.otel_exporter_otlp_endpoint, settings.env)

    app = FastAPI(title="ITSM Incident Service", version="1.0.0", docs_url="/docs")

    @app.on_event("startup")
    async def startup():
        init_db(settings.database_url)
        await mq.init_mq(settings.rabbitmq_url)
        SQLAlchemyInstrumentor().instrument(engine=db._engine.sync_engine)
        logger.info("Incident service started: env=%s", settings.env)

    @app.on_event("shutdown")
    async def shutdown():
        await close_db()
        await mq.close_mq()

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(status_code=400, content={"error": str(exc)})

    FastAPIInstrumentor.instrument_app(app)
    app.include_router(router)
    return app


app = create_app()
