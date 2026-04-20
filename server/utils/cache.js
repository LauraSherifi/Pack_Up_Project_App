const store = new Map();
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let redisClient = null;
let redisConnectPromise = null;
let redisDisabled = false;

const getRedisClient = async () => {
  if (redisDisabled) return null;

  try {
    const { createClient } = require('redis');

    if (!redisClient) {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      redisClient.on('error', (err) => {
        console.warn('Redis cache error:', err.message);
      });
    }

    if (!redisClient.isOpen) {
      redisConnectPromise = redisConnectPromise || redisClient.connect().catch((err) => {
        redisConnectPromise = null;
        throw err;
      });
      await redisConnectPromise;
    }

    return redisClient;
  } catch (err) {
    redisDisabled = true;
    console.warn('Redis cache disabled, using in-memory cache:', err.message);
    return null;
  }
};

const getMemoryCache = (key) => {
  const entry = store.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return entry.value;
};

const setMemoryCache = (key, value, ttlMs) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

const deleteMemoryCache = (key) => {
  store.delete(key);
};

const getCache = async (key) => {
  const client = await getRedisClient();

  if (client) {
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  return getMemoryCache(key);
};

const setCache = async (key, value, ttlMs) => {
  const client = await getRedisClient();

  if (client) {
    await client.set(key, JSON.stringify(value), {
      PX: ttlMs,
    });
    return;
  }

  setMemoryCache(key, value, ttlMs);
};

const deleteCache = async (key) => {
  const client = await getRedisClient();

  if (client) {
    await client.del(key);
    return;
  }

  deleteMemoryCache(key);
};

module.exports = {
  deleteCache,
  getCache,
  setCache,
};
