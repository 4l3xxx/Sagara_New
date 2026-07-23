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

const { initDatabase }  = require('./src/helpers/dbInit');
const { initDataFiles } = require('./src/helpers/dataInit');
const { PORT }          = require('./src/config/constants');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Route modules ─────────────────────────────────────────────────────────────
app.use(require('./src/routes/health'));
app.use(require('./src/routes/chat'));          // /api/chat  (toxic filter included)
app.use(require('./src/routes/consultation'));  // /api/consultation
app.use(require('./src/routes/blogs'));         // /api/blogs
app.use(require('./src/routes/jobs'));          // /api/jobs
app.use(require('./src/routes/portfolio'));     // /api/portfolio
app.use(require('./src/routes/face'));          // /api/face
app.use(require('./src/routes/spam'));          // /api/spam
app.use(require('./src/routes/security'));      // /api/admin/security-overview
app.use(require('./src/routes/admin'));         // /admin  +  /api/admin

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
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
