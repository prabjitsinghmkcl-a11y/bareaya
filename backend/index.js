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
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const path = require('path');
const { config: rateConfig } = require('./config/rateLimit');


dotenv.config();

const app = express();

app.disable('x-powered-by');

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
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
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

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
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

