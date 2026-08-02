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

app.set('trust proxy', 1);

const isDevelopment = app.get('env') === 'development';

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'"],
      fontSrc:        ["'self'"],
      imgSrc:         ["'self'", "data:", "blob:", "https://randomuser.me", "https://images.unsplash.com", "https://lh3.googleusercontent.com", "https://ui-avatars.com", "https://placehold.co"],
      connectSrc:     ["'self'"],
      workerSrc:      ["'self'", "blob:"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      frameAncestors: ["'none'"],
      formAction:     ["'self'"],
      upgradeInsecureRequests: [],
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin:      process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

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

app.use('/admin', (req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://ui-avatars.com https://placehold.co https://lh3.googleusercontent.com; " +
    "connect-src 'self'; " +
    "worker-src 'self' blob:; " +
    "frame-ancestors 'none'; " +
    "object-src 'none';"
  );
  next();
});

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
