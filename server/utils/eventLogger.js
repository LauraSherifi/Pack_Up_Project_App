const db = require('../config/db');
const { publishEventMessage } = require('./rabbitmq');

const toPayload = (payload) => {
  if (!payload || Object.keys(payload).length === 0) return null;

  try {
    return JSON.stringify(payload);
  } catch (err) {
    return JSON.stringify({ serializationError: true });
  }
};

const publishEvent = ({ eventType, entityType, entityId = null, payload = {} }) => {
  if (!eventType || !entityType) return;

  const sql = `
    INSERT INTO event_logs (event_type, entity_type, entity_id, payload)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [eventType, entityType, entityId, toPayload(payload)], (err, result) => {
    if (err) {
      console.warn('Event log write failed:', err.message);
      return;
    }

    publishEventMessage({
      eventLogId: result.insertId,
      eventType,
      entityType,
      entityId,
      payload,
      createdAt: new Date().toISOString(),
    }).catch((publishErr) => {
      console.warn('RabbitMQ event publish failed:', publishErr.message);
    });
  });
};

module.exports = {
  publishEvent,
};
