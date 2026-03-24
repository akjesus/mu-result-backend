const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const pool = mysql.createPool({
  host: process.env.DATABASE_SERVER || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // Specify the custom port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log(`Connected to MySQL database on port ${process.env.DB_PORT}`);
        connection.release();
    }
});

module.exports = pool.promise();
