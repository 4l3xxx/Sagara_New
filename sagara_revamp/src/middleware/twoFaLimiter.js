'use strict';
const rateLimit = require('express-rate-limit');

const twoFaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan verifikasi 2FA. Coba lagi dalam 15 menit.' },
});

module.exports = twoFaLimiter;
