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

const indexes = [
  {
    table: 'reviews',
    name: 'unique_review_user_trip',
    sql: 'ALTER TABLE reviews ADD UNIQUE KEY unique_review_user_trip (user_id, trip_id)',
  },
  {
    table: 'reviews',
    name: 'idx_reviews_trip_id',
    sql: 'ALTER TABLE reviews ADD INDEX idx_reviews_trip_id (trip_id)',
  },
  {
    table: 'reviews',
    name: 'idx_reviews_user_id',
    sql: 'ALTER TABLE reviews ADD INDEX idx_reviews_user_id (user_id)',
  },
];

const getDuplicateReviews = async (connection) => {
  const [rows] = await connection.query(`
    SELECT user_id, trip_id, COUNT(*) AS duplicate_count
    FROM reviews
    GROUP BY user_id, trip_id
    HAVING COUNT(*) > 1
  `);
  return rows;
};

const indexExists = async (connection, table, indexName) => {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      LIMIT 1
    `,
    [table, indexName]
  );
  return rows.length > 0;
};

const run = async () => {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const duplicates = await getDuplicateReviews(connection);
    if (duplicates.length > 0) {
      console.error('Cannot add unique review constraint while duplicate reviews exist:');
      console.table(duplicates);
      process.exitCode = 1;
      return;
    }

    for (const index of indexes) {
      const exists = await indexExists(connection, index.table, index.name);
      if (exists) {
        console.log(`Skipped ${index.name}: already exists`);
        continue;
      }

      await connection.query(index.sql);
      console.log(`Added ${index.name}`);
    }

    console.log('Database integrity migration completed.');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Database integrity migration failed:', err.message);
  process.exit(1);
});
