// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");
// const connectDB = require("./config/db");
// dotenv.config();
// connectDB();



// const app = express();
// app.use(cors(
//     {
//         origin: ["http://localhost:3000", "http://127.0.0.1:3000", process.env.FRONTEND_URL], // Replace with your frontend URL
//         credentials: true, // Allow cookies to be sent
//     }
// ));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.get("/", (req, res) => {
//     res.send("bareaya backend is running");
// });

// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/products", require("./routes/productRoutes"));
// app.use("/api/orders", require("./routes/orderRoutes"));
// app.use("/api/payment", require("./routes/paymentRoutes"));
// app.use("/api/analytics", require("./routes/analyticsRoutes"));


// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//     try {
//         await connectDB();
//         app.listen(PORT, () => {
//             console.log(`Server is running on port ${PORT}`);
//         });
//     } catch (error) {
//         console.error("Server could not start because MongoDB is unavailable.");
//         process.exit(1);
//     }
// };

// startServer();
const express = require('express');
const compression = require('compression');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
const { config: rateConfig } = require('./config/rateLimit');


dotenv.config();

const app = express();

app.disable('x-powered-by');

// gzip/br for every text-ish response (JS, CSS, HTML, JSON, SVG). This shrinks
// the ~122 kB gzipped main bundle and all API JSON. Mounted first so it also
// covers static assets; the Razorpay webhook keeps its raw body regardless
// because compression only acts on the response, never the parsed request.
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// Trust proxy hops so req.ip reflects the real client as needed for rate limiting
if (rateConfig.TRUST_PROXY > 0) {
  app.set('trust proxy', rateConfig.TRUST_PROXY);
}

// Security headers. A strict Content-Security-Policy is only applied in
// production so the CRA dev server can keep calling the API on another port.
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://*.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://theskinstory.in", "https://e-fillers.com", "https://*.gstatic.com", "https://encrypted-tbn0.gstatic.com"],
        // Without this the hero <video> falls back to defaultSrc 'self' and the
        // Cloudinary clip is blocked, leaving only the poster frame.
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://*.razorpay.com"],
        frameSrc: ["https://checkout.razorpay.com", "https://api.razorpay.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }));
} else {
  app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
}

// Restrict CORS. In production only the configured frontend origin is allowed.
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Razorpay webhook must receive the RAW body (for signature verification) and
// needs no rate limiter/auth — it is verified by its own HMAC signature.
// It is mounted before the JSON parser so the raw bytes are preserved.
const { webhookHandler } = require('./controllers/paymentController');
app.post(
  '/api/payment/webhook',
  express.raw({ type: () => true, limit: '2mb' }),
  (req, res) => {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body);
    } catch (err) {
      console.error('[Razorpay] Webhook body is not valid JSON:', err.message);
      req.body = {};
    }
    webhookHandler(req, res);
  }
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));

// Lightweight liveness probe — no auth, no database, constant response.
// An external cron (see .github/workflows/keep-alive.yml) hits this every
// ~14 minutes so the Render free instance never spins down; without it the
// first visitor of the day would wait through a cold start while the app
// boots. Render can also use it as a fast health signal.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Hosts from which the admin panel may be loaded. Everything else — the
// public bareaya.in domain, www — gets a hard 404 on every /admin path, so
// scanners, link previews and curious visitors never even reach a login
// screen. The Render-generated origin is included as the working admin URL
// (and as a fallback) until admin.bareaya.in is set up; override the list
// via the ADMIN_HOSTS env var (comma separated) if the subdomain moves.
const ADMIN_HOSTS = new Set(
  (process.env.ADMIN_HOSTS ||
    'admin.bareaya.in,bareaya-qjzm.onrender.com,localhost,127.0.0.1')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
);

const isAdminHost = (req) => {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  return ADMIN_HOSTS.has(host);
};

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const CUSTOMER_BUILD = path.join(__dirname, '../frontend/build');
  // Admin-only bundle produced by `npm run build:both`. Until that step is
  // wired up the admin host falls back to the customer bundle — the /admin
  // gate below still keeps the public host locked either way.
  const ADMIN_BUILD = path.join(__dirname, '../frontend/build-admin');
  const buildDirFor = (req) =>
    isAdminHost(req) && fs.existsSync(ADMIN_BUILD) ? ADMIN_BUILD : CUSTOMER_BUILD;

  // The admin panel may only be loaded from the dedicated admin subdomain;
  // on any other host every /admin path hard-404s before touching the SPA.
  app.use((req, res, next) => {
    if (req.path.startsWith('/admin') && !isAdminHost(req)) {
      return res
        .status(404)
        .type('html')
        .send('<!doctype html><html><head><title>404</title></head><body><h1>404 Not Found</h1></body></html>');
    }
    // Typing the bare admin subdomain lands straight on the admin app.
    if (isAdminHost(req) && req.path === '/') {
      return res.redirect('/admin');
    }
    next();
  });

  // Content-hashed files under /static can be cached forever — a new deploy
  // changes the hash, so a stale cache entry can never be served.
  app.use('/static', (req, res, next) => {
    express.static(path.join(buildDirFor(req), 'static'), {
      maxAge: '1y',
      immutable: true,
    })(req, res, next);
  });

  // Everything else in the build (index.html, manifest, robots, icons) must
  // always be revalidated so a new deploy is picked up immediately.
  app.use((req, res, next) => {
    express.static(buildDirFor(req), {
      maxAge: '1h',
      etag: true,
      lastModified: true,
      setHeaders: (res2, filePath) => {
        if (path.basename(filePath) === 'index.html') {
          res2.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
      },
    })(req, res, next);
  });

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.resolve(buildDirFor(req), 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Bareaya API is running in Development mode...');
  });
}

// Central error handler: log full details server-side, return generic client message
// (no stack traces, internal paths, or raw DB/body-parser error text).
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    console.error(`[Malformed JSON] ${req.method} ${req.originalUrl}`);
    return res.status(400).json({ message: 'Malformed JSON in request body', errors: ['Invalid JSON'] });
  }
  const status = err.status || 500;
  console.error(`[Unhandled Error ${status}] ${req.method} ${req.originalUrl}`);
  if (err && err.message) console.error(err.message);
  if (err && err.stack) console.error(err.stack);
  const message = status >= 500 ? 'Internal server error' : 'Request could not be processed';
  res.status(status).json({ message, errors: [message] });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Server could not start because MongoDB is unavailable.');
    if (error && error.message) console.error(error.message);
    process.exit(1);
  }
};

startServer();

// Server-side logging for anything that escapes request handling
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

