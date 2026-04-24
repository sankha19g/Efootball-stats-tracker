const mysql = require('mysql2/promise');

let pool;

const getPool = () => {
    if (!pool) {
        const connectionString = process.env.MYSQL_URL;

        if (connectionString) {
            // Parse connection string: mysql://user:pass@host:port/dbname?ssl=true
            pool = mysql.createPool(connectionString + '&waitForConnections=true&connectionLimit=10&queueLimit=0');
        } else {
            // Fallback to individual env vars
            pool = mysql.createPool({
                host: process.env.MYSQL_HOST || 'localhost',
                port: parseInt(process.env.MYSQL_PORT || '3306'),
                user: process.env.MYSQL_USER || 'root',
                password: process.env.MYSQL_PASSWORD || '',
                database: process.env.MYSQL_DATABASE || 'efootball',
                ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        }
    }
    return pool;
};

/**
 * Execute a SQL query with parameters
 */
const query = async (sql, params = []) => {
    const db = getPool();
    const [rows] = await db.execute(sql, params);
    return rows;
};

/**
 * Get a single row by query
 */
const queryOne = async (sql, params = []) => {
    const rows = await query(sql, params);
    return rows[0] || null;
};

/**
 * Test the connection
 */
const testConnection = async () => {
    try {
        await query('SELECT 1');
        console.log('✅ Connected to MySQL');
    } catch (err) {
        console.error('❌ MySQL connection error:', err.message);
    }
};

module.exports = { query, queryOne, testConnection, getPool };
