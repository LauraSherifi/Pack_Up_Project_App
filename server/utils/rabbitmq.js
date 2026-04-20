const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EVENTS_EXCHANGE = process.env.RABBITMQ_EVENTS_EXCHANGE || 'packup.events';
const EVENTS_QUEUE = process.env.RABBITMQ_EVENTS_QUEUE || 'packup.events.main';
const EVENTS_DLX = process.env.RABBITMQ_EVENTS_DLX || 'packup.events.dlx';
const EVENTS_DLQ = process.env.RABBITMQ_EVENTS_DLQ || 'packup.events.dlq';
const ROUTING_KEY = process.env.RABBITMQ_EVENTS_ROUTING_KEY || 'packup.event';

let amqp = null;
let connectionPromise = null;

const loadAmqp = () => {
  if (amqp) return amqp;

  try {
    amqp = require('amqplib');
    return amqp;
  } catch (err) {
    console.warn('RabbitMQ disabled: install amqplib to enable broker publishing.');
    return null;
  }
};

const getConnection = async () => {
  const library = loadAmqp();
  if (!library) return null;

  if (!connectionPromise) {
    connectionPromise = library.connect(RABBITMQ_URL).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }

  return connectionPromise;
};

const setupEventTopology = async (channel) => {
  await channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertExchange(EVENTS_DLX, 'topic', { durable: true });

  await channel.assertQueue(EVENTS_DLQ, { durable: true });
  await channel.bindQueue(EVENTS_DLQ, EVENTS_DLX, '#');

  await channel.assertQueue(EVENTS_QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EVENTS_DLX,
    },
  });
  await channel.bindQueue(EVENTS_QUEUE, EVENTS_EXCHANGE, ROUTING_KEY);
};

const publishEventMessage = async (event) => {
  const connection = await getConnection();
  if (!connection) return false;

  const channel = await connection.createChannel();

  try {
    await setupEventTopology(channel);
    return channel.publish(
      EVENTS_EXCHANGE,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(event)),
      {
        contentType: 'application/json',
        deliveryMode: 2,
        timestamp: Date.now(),
      }
    );
  } finally {
    await channel.close();
  }
};

module.exports = {
  EVENTS_QUEUE,
  publishEventMessage,
  setupEventTopology,
  getConnection,
};
