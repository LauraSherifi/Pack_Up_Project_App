const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const run = async () => {
  const connection = await mysql.createConnection(dbConfig);

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(80) NOT NULL,
        entity_id INT NULL,
        payload TEXT NULL,
        processed TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_event_entity (entity_type, entity_id),
        INDEX idx_event_processed (processed)
      )
    `);

    console.log('Event log table is ready.');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Event migration failed:', err.message);
  process.exit(1);
});
