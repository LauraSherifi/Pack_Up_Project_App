const dotenv = require('dotenv');
const path = require('path');
const db = require('../config/db');
const { EVENTS_QUEUE, getConnection, setupEventTopology } = require('../utils/rabbitmq');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const markEventProcessed = (eventLogId) => {
  if (!eventLogId) return;

  db.query('UPDATE event_logs SET processed = 1 WHERE id = ?', [eventLogId], (err) => {
    if (err) {
      console.warn('Failed to mark event as processed:', err.message);
    }
  });
};

const handleEvent = async (message) => {
  const event = JSON.parse(message.content.toString('utf8'));

  if (!event.eventType || !event.entityType) {
    throw new Error('Invalid event payload');
  }

  markEventProcessed(event.eventLogId);
  console.log(`Processed ${event.eventType} event`, {
    eventLogId: event.eventLogId,
    entityType: event.entityType,
    entityId: event.entityId,
  });
};

const start = async () => {
  const connection = await getConnection();

  if (!connection) {
    console.error('RabbitMQ consumer cannot start because amqplib is not installed.');
    process.exit(1);
  }

  const channel = await connection.createChannel();
  await setupEventTopology(channel);
  await channel.prefetch(5);

  console.log(`RabbitMQ event consumer listening on ${EVENTS_QUEUE}`);

  await channel.consume(EVENTS_QUEUE, async (message) => {
    if (!message) return;

    try {
      await handleEvent(message);
      channel.ack(message);
    } catch (err) {
      console.warn('Event processing failed, sending to DLQ:', err.message);
      channel.nack(message, false, false);
    }
  });
};

start().catch((err) => {
  console.error('RabbitMQ event consumer failed:', err.message);
  process.exit(1);
});
