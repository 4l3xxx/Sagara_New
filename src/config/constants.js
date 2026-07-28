'use strict';
const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

module.exports = {
  PORT:               parseInt(process.env.PORT, 10) || 3000,
  DATA_DIR,
  CHATS_FILE:         path.join(DATA_DIR, 'chats.json'),
  CONTENT_FILE:       path.join(DATA_DIR, 'content.json'),
  CONSULTATIONS_FILE: path.join(DATA_DIR, 'consultations.json'),
  FACES_FILE:         path.join(DATA_DIR, 'faces.json'),
  BLOGS_FILE:         path.join(DATA_DIR, 'blogs.json'),
  JOBS_FILE:          path.join(DATA_DIR, 'jobs.json'),
  PORTFOLIOS_FILE:    path.join(DATA_DIR, 'portfolios.json'),
  SPAM_LOG_FILE:      path.join(DATA_DIR, 'spam_logs.json'),
  TOXIC_LOG_FILE:     path.join(DATA_DIR, 'toxic_logs.json'),
  LOGIN_LOG_FILE:     path.join(DATA_DIR, 'login_logs.json'),
  ATTENDANCE_FILE:    path.join(DATA_DIR, 'attendance.json'),
};
