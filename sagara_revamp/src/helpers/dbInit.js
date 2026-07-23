'use strict';
const pool = require('../config/database');

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consultation_requests (
        id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        business_email VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        company_size VARCHAR(100),
        budget VARCHAR(100),
        industry VARCHAR(100),
        sentiment VARCHAR(50),
        sentiment_score NUMERIC,
        nlp_category VARCHAR(100),
        lead_score NUMERIC,
        status VARCHAR(50) DEFAULT 'New',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        salary VARCHAR(100) NOT NULL,
        experience VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        requirements JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_accounts (
        username VARCHAR(50) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin'
      );
    `);

    await pool.query(
      `ALTER TABLE admin_accounts ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin'`
    ).catch(() => {/* column already exists */});

    const LOCKED = 'LOCKED';
    const admins = [
      { username: 'samuel',    password: process.env.ADMIN_1_PASS || LOCKED, role: 'superadmin' },
      { username: 'alexander', password: process.env.ADMIN_2_PASS || LOCKED, role: 'admin'      },
      { username: 'alex',      password: process.env.ADMIN_2_PASS || LOCKED, role: 'admin'      },
      { username: 'putra',     password: process.env.ADMIN_3_PASS || LOCKED, role: 'admin'      },
    ];
    for (const a of admins) {
      await pool.query(
        `INSERT INTO admin_accounts (username,password,role) VALUES ($1,$2,$3)
         ON CONFLICT (username) DO UPDATE SET password=$2, role=$3`,
        [a.username, a.password, a.role]
      );
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[DB] Schema initialized.');
  } catch (err) {
    console.error('[DB] Init error:', err.message);
  }
}

module.exports = { initDatabase };
