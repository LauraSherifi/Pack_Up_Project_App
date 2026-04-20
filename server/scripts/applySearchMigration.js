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
    const exists = await indexExists(connection, 'trips', 'fulltext_trips_title_description');

    if (exists) {
      console.log('Skipped fulltext_trips_title_description: already exists');
      return;
    }

    await connection.query(`
      ALTER TABLE trips
      ADD FULLTEXT KEY fulltext_trips_title_description (title, description)
    `);

    console.log('Added fulltext_trips_title_description');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Search migration failed:', err.message);
  process.exit(1);
});
