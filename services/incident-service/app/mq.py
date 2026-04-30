"""RabbitMQ publisher using aio-pika with durable queues and W3C trace context propagation."""
from __future__ import annotations

import json
import logging

import aio_pika
from opentelemetry import propagate

logger = logging.getLogger(__name__)

_connection: aio_pika.abc.AbstractRobustConnection | None = None
_channel: aio_pika.abc.AbstractChannel | None = None
_exchange: aio_pika.abc.AbstractExchange | None = None

EXCHANGE_NAME = "itsm.incidents"


async def init_mq(rabbitmq_url: str) -> None:
    global _connection, _channel, _exchange
    _connection = await aio_pika.connect_robust(rabbitmq_url)
    _channel = await _connection.channel()
    _exchange = await _channel.declare_exchange(
        EXCHANGE_NAME,
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )
    logger.info("RabbitMQ connected: exchange=%s", EXCHANGE_NAME)


async def close_mq() -> None:
    if _connection and not _connection.is_closed:
        await _connection.close()
        logger.info("RabbitMQ connection closed")


async def publish(routing_key: str, payload: dict) -> None:
    """Publish a message with W3C trace context injected into headers."""
    if _exchange is None:
        logger.warning("RabbitMQ exchange not initialised — skipping publish")
        return

    # Inject W3C traceparent/tracestate into message headers
    carrier: dict[str, str] = {}
    propagate.inject(carrier)

    headers = {**carrier, "content-type": "application/json"}

    message = aio_pika.Message(
        body=json.dumps(payload, default=str).encode(),
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        headers=headers,
        content_type="application/json",
    )

    await _exchange.publish(message, routing_key=routing_key)
    logger.debug("Published to %s / %s", EXCHANGE_NAME, routing_key)
