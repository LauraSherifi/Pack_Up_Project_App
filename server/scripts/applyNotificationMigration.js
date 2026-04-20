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
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(40) NOT NULL DEFAULT 'info',
        entity_type VARCHAR(80) NULL,
        entity_id INT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user_read (user_id, is_read),
        INDEX idx_notifications_created_at (created_at),
        INDEX idx_notifications_entity (entity_type, entity_id)
      )
    `);

    console.log('Notifications table is ready.');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Notification migration failed:', err.message);
  process.exit(1);
});
