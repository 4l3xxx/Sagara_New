'use strict';
const { sessions } = require('../state');

/**
 * Express middleware — protects admin routes via session-cookie.
 * - Sets req.sessionUser on success.
 * - API paths → 401 JSON on failure.
 * - HTML paths → redirect to /admin/login on failure.
 */
function adminAuth(req, res, next) {
  const cookie    = req.headers.cookie || '';
  const sessionId = cookie.match(/adminSession=([^;]+)/)?.[1];

  if (sessionId && sessions[sessionId]) {
    req.sessionUser = sessions[sessionId].username;
    return next();
  }

  return req.path.startsWith('/api/')
    ? res.status(401).json({ error: 'Authentication required' })
    : res.redirect('/admin/login');
}

module.exports = adminAuth;
