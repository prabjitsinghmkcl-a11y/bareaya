const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const int = (val, def) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const strBool = (val, def) => {
  if (val === undefined || val === '') return def;
  return !['0', 'false', 'no', 'off'].includes(String(val).toLowerCase());
};

const config = {
  enabled: strBool(process.env.RATE_LIMIT_ENABLED, true),

  // Moderate limits for public endpoints (product listing, product details)
  PUBLIC_WINDOW_MS: int(process.env.RATE_PUBLIC_WINDOW_MS, 15 * 60 * 1000),
  PUBLIC_MAX: int(process.env.RATE_PUBLIC_MAX, 180),

  // Loose limits for authenticated user actions (orders, etc.)
  AUTHED_WINDOW_MS: int(process.env.RATE_AUTHED_WINDOW_MS, 15 * 60 * 1000),
  AUTHED_MAX: int(process.env.RATE_AUTHED_MAX, 600),

  // Strict per-IP limits for auth routes (login, register)
  AUTH_IP_WINDOW_MS: int(process.env.RATE_AUTH_IP_WINDOW_MS, 15 * 60 * 1000),
  AUTH_IP_MAX: int(process.env.RATE_AUTH_IP_MAX, 30),

  // Strict per-account limits for auth routes
  AUTH_ACCOUNT_WINDOW_MS: int(process.env.RATE_AUTH_ACCOUNT_WINDOW_MS, 15 * 60 * 1000),
  AUTH_ACCOUNT_MAX: int(process.env.RATE_AUTH_ACCOUNT_MAX, 5),

  // Exponential backoff bounds (0 disables the growing cooldown -> fixed window only)
  AUTH_LOCKOUT_BASE_MS: int(process.env.RATE_AUTH_LOCKOUT_BASE_MS, 30 * 1000),
  AUTH_LOCKOUT_MAX_MS: int(process.env.RATE_AUTH_LOCKOUT_MAX_MS, 6 * 60 * 60 * 1000),

  // Number of proxies in front of the server (affects req.ip detection)
  TRUST_PROXY: int(process.env.RATE_TRUST_PROXY, 0),
};

const store = new Map();

const ipKey = (req) => {
  const ip = String(req.ip || req.socket?.remoteAddress || 'unknown').replace('::ffff:', '');
  return `ip:${ipKeyGenerator(ip)}`;
};

const accountKey = (req) => {
  const body = req.body || {};
  const phone = String(body.phone || '').trim();
  if (phone) return `ph:${phone}`;
  const email = String(body.email || '').trim().toLowerCase();
  return email ? `em:${email}` : null;
};

const json429 = (res, retryAfterSec) => {
  if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) {
    res.set('Retry-After', String(retryAfterSec));
  }
  return res.status(429).json({
    message: 'Too many requests. Please try again later.',
    retryAfterSeconds: Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec : 0
  });
};

// Periodically sweep stale entries so the in-memory Map never leaks.
const MAX_RECORD_AGE = Math.max(
  config.PUBLIC_WINDOW_MS,
  config.AUTHED_WINDOW_MS,
  config.AUTH_IP_WINDOW_MS,
  config.AUTH_ACCOUNT_WINDOW_MS,
  config.AUTH_LOCKOUT_MAX_MS
);
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    if (now - rec.windowStart >= MAX_RECORD_AGE && rec.blockedUntil <= now) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Auth-route limiter with per-key exponential backoff.
 * Exceeding `maxAttempts` within `windowMs` blocks the key for
 * base * 2^(level-1) ms (capped at AUTH_LOCKOUT_MAX_MS). Each violation
 * doubles the cooldown instead of applying a fixed hard lockout.
 */
const createAuthLimiter = ({ name, max, windowMs, getKey }) => {
  if (!config.enabled) return (req, res, next) => next();

  const maxAttempts = max > 0 ? max : 1;

  return function authLimiter(req, res, next) {
    let key = null;
    try {
      key = getKey(req);
    } catch (err) {
      key = null;
    }
    if (!key) key = ipKey(req);
    key = `${name}:${key}`;

    const now = Date.now();
    let rec = store.get(key);

    if (!rec || now - rec.windowStart >= windowMs) {
      store.set(key, { count: 1, level: 1, windowStart: now, blockedUntil: 0 });
      return next();
    }

    if (rec.blockedUntil > now) {
      return json429(res, Math.ceil((rec.blockedUntil - now) / 1000));
    }

    rec.count += 1;

    if (rec.count > maxAttempts) {
      const backoff = Math.min(
        config.AUTH_LOCKOUT_BASE_MS * Math.pow(2, rec.level - 1),
        config.AUTH_LOCKOUT_MAX_MS
      );
      rec.level += 1;
      rec.count = 0;
      rec.windowStart = now;
      rec.blockedUntil = now + backoff;
      return json429(res, Math.ceil(backoff / 1000));
    }

    next();
  };
};

const authIpLimiter = createAuthLimiter({
  name: 'authip',
  max: config.AUTH_IP_MAX,
  windowMs: config.AUTH_IP_WINDOW_MS,
  getKey: ipKey
});

const authAccountLimiter = createAuthLimiter({
  name: 'authacct',
  max: config.AUTH_ACCOUNT_MAX,
  windowMs: config.AUTH_ACCOUNT_WINDOW_MS,
  getKey: accountKey
});

const mkRateLimit = ({ windowMs, max, keyGen }) => {
  if (!config.enabled) return (req, res, next) => next();
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGen,
    handler: (req, res) => {
      res.set('X-RateLimit-Limit', String(max));
      return json429(res, 0);
    }
  });
};

const publicLimiter = mkRateLimit({
  windowMs: config.PUBLIC_WINDOW_MS,
  max: config.PUBLIC_MAX,
  keyGen: ipKey
});

// NOTE: must run AFTER `protect` so req.user is populated.
const authenticatedLimiter = mkRateLimit({
  windowMs: config.AUTHED_WINDOW_MS,
  max: config.AUTHED_MAX,
  keyGen: (req) => (req.user && req.user._id ? `user:${req.user._id.toString()}` : ipKey(req))
});

// Clears the per-ACCOUNT counter after a genuine successful authentication.
// The per-IP counter is deliberately NOT cleared: it is an abuse-prevention
// budget, and clearing it on success let a caller launder an unlimited number
// of attempts by interleaving successful requests with probes.
const resetAuthAttempts = ({ phone, email } = {}) => {
  if (phone) store.delete(`authacct:ph:${String(phone).trim()}`);
  if (email) store.delete(`authacct:em:${String(email).trim().toLowerCase()}`);
};

module.exports = {
  config,
  store,
  publicLimiter,
  authenticatedLimiter,
  authIpLimiter,
  authAccountLimiter,
  resetAuthAttempts
};