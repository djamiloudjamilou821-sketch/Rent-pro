require("dotenv").config();

const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDB() {
    try {

        // ===========================
        // USERS
        // ===========================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ===========================
        // RENTERS
        // ===========================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS renters (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                start_date DATE NOT NULL DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ===========================
        // PAYMENTS
        // ===========================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                renter_id INTEGER NOT NULL
                    REFERENCES renters(id)
                    ON DELETE CASCADE,
                amount INTEGER NOT NULL,
                payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ===========================
        // CREATE DEFAULT ADMIN
        // ===========================
        const admin = await pool.query(
            "SELECT * FROM users WHERE username=$1",
            ["admin"]
        );

        if (admin.rows.length === 0) {

            const hashedPassword = await bcrypt.hash("1234", 10);

            await pool.query(
                `
                INSERT INTO users
                (username, password)
                VALUES ($1, $2)
                `,
                ["admin", hashedPassword]
            );

            console.log("✅ Default admin created");
            console.log("Username: admin");
            console.log("Password: 1234");
        }

        console.log("✅ Database initialized successfully!");

    } catch (err) {

        console.error("❌ Database initialization failed");
        console.error(err);

    }
}

module.exports = {
    pool,
    initDB
};