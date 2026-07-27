'use strict';
const pool = require('../config/database');

/**
 * Returns the role of an admin from Postgres, with sane fallbacks.
 * @param {string} username
 * @returns {Promise<string>}
 */
async function getUserRole(username) {
  try {
    const res = await pool.query('SELECT role FROM admin_accounts WHERE username = $1', [username]);
    if (res.rows.length > 0) return res.rows[0].role;
  } catch (err) {
    console.error('[Audit] getUserRole DB error:', err.message);
  }
  if (username === 'samuel')                              return 'superadmin';
  if (['alex', 'alexander', 'putra'].includes(username)) return 'admin';
  return 'admin';
}

/**
 * Writes one audit-log row to Postgres.
 * Non-blocking — swallows errors gracefully.
 * @param {string}  username
 * @param {string}  action
 * @param {string}  details
 * @param {object}  [req]    - Express request (for IP extraction)
 */
async function createAuditLog(username, action, details, req) {
  try {
    const role = await getUserRole(username);

    let ip = '';
    if (req) {
      ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '';
      if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    }

    await pool.query(
      `INSERT INTO audit_logs (username, role, action, details, ip_address) VALUES ($1,$2,$3,$4,$5)`,
      [username, role, action, details, ip],
    );
    console.log(`[AUDIT] ${username} (${role}) → ${action}: ${details} [${ip}]`);
  } catch (err) {
    console.error('[Audit] createAuditLog error:', err.message);
  }
}

module.exports = { getUserRole, createAuditLog };
