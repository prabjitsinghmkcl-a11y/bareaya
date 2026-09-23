// Centralized error responder: logs full server-side details, returns
// generic message to the client (no stack traces, paths, or raw DB errors).
const sendErrorResponse = (res, error, { status: overrideStatus, fallback } = {}) => {
  const url = res.req ? `${res.req.method} ${res.req.originalUrl}` : 'n/a';

  // --- Determine status code from error type ---
  let status = overrideStatus || 500;
  let message = fallback || 'Internal server error';

  if (!overrideStatus && error) {
    // Mongoose validation error (schema-level)
    if (error.name === 'ValidationError') {
      status = 422;
      const firstKey = Object.keys(error.errors || {})[0];
      message = firstKey ? error.errors[firstKey].message : 'Validation failed';
    }
    // Mongoose cast error (e.g. invalid ObjectId)
    else if (error.name === 'CastError') {
      status = 400;
      message = `Invalid value for ${error.path}`;
    }
    // MongoDB duplicate key
    else if (error.code === 11000) {
      status = 409;
      message = 'Duplicate value — this record already exists';
    }
    // JWT / auth errors
    else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      status = 401;
      message = 'Not authorized';
    }
  }

  console.error(`[API Error ${status}] ${url}`);
  if (error && error.message) console.error(error.message);
  if (error && error.stack) console.error(error.stack);
  res.status(status).json({ message });
};

module.exports = { sendErrorResponse };