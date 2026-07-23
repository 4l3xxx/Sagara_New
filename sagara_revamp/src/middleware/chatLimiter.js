'use strict';
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak pesan. Harap tunggu sebentar sebelum mengirim lagi.' },
});

module.exports = chatLimiter;
