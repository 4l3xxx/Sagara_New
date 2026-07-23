'use strict';
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).send(
      `<script>alert('Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.');window.location='/admin/login';</script>`
    );
  },
});

module.exports = loginLimiter;
