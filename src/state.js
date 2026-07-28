'use strict';
/**
 * Shared in-memory state.
 * Single module instance = all route files see the same object references.
 */

/** @type {Record<string, { username: string, loginAt: Date }>} */
const sessions = {};

/** @type {Record<string, string>} */
const twoFASecrets = {};

const ADMINS = [
  { username: process.env.ADMIN_1_USER, passwordHash: process.env.ADMIN_1_PASS },
  { username: process.env.ADMIN_2_USER, passwordHash: process.env.ADMIN_2_PASS },
  { username: process.env.ADMIN_3_USER, passwordHash: process.env.ADMIN_3_PASS },
].filter(a => a.username && a.passwordHash);

module.exports = { sessions, twoFASecrets, ADMINS };
