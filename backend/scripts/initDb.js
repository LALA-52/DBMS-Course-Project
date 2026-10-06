const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
  console.log('--- Initializing Pharmacy Database ---');
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '2250', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  console.log(`Connecting to MySQL on ${host}:${port} as user ${user}...`);

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('Connected to MySQL successfully!');

    const sqlPath = path.join(__dirname, '..', '..', 'database', 'pharmacy_management.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing pharmacy_management.sql schema and seed data...');
    await connection.query(sql);

    console.log('Database and tables initialized successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
}

initDatabase();
