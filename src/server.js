'use strict';
// ═══════════════════════════════════════════════════════════════
//  SAGARA SERVER  —  Entry Point
//  All business logic lives in src/
// ═══════════════════════════════════════════════════════════════
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const path    = require('path');

const { initDatabase }  = require('./helpers/dbInit');
const { initDataFiles } = require('./helpers/dataInit');
const { PORT }          = require('./config/constants');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
  'http://localhost:3000',
  'https://sagararevamp.biz.id',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin === 'null' || allowedOrigins.includes(origin) || (origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')))) {
      callback(null, true);
    } else {
      console.error('CORS Error for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d' // Adds Cache-Control header (e.g. public, max-age=86400)
}));

// ── Route modules ─────────────────────────────────────────────────────────────
app.use(require('./routes/health'));
app.use(require('./routes/chat'));          // /api/chat  (toxic filter included)
app.use(require('./routes/consultation'));  // /api/consultation
app.use(require('./routes/blogs'));         // /api/blogs
app.use(require('./routes/jobs'));          // /api/jobs
app.use(require('./routes/portfolio'));     // /api/portfolio
app.use(require('./routes/face'));          // /api/face
app.use(require('./routes/spam'));          // /api/spam
app.use(require('./routes/security'));      // /api/admin/security-overview
app.use(require('./routes/admin'));         // /admin  +  /api/admin

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../public', 'index.html'))
);

// ── Boot sequence ─────────────────────────────────────────────────────────────
(async () => {
  await initDatabase();
  initDataFiles();

  app.listen(PORT, () => {
    const line = '═'.repeat(50);
    console.log(`\n${line}`);
    console.log('  SAGARA SERVER  —  RUNNING');
    console.log(line);
    console.log(`  Website  : http://localhost:${PORT}`);
    console.log(`  Admin    : http://localhost:${PORT}/admin/login`);
    console.log(`  API      : http://localhost:${PORT}/api/health`);
    console.log(line + '\n');
  });
})();
