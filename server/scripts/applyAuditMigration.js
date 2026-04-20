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
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(80) NOT NULL,
        entity_type VARCHAR(80) NOT NULL,
        entity_id INT NULL,
        metadata TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_user_id (user_id),
        INDEX idx_audit_action (action),
        INDEX idx_audit_entity (entity_type, entity_id)
      )
    `);

    console.log('Audit log table is ready.');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Audit migration failed:', err.message);
  process.exit(1);
});
