const jwt = require('jsonwebtoken');
const User = require('../model/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token', code: 'NO_TOKEN' });
  }

  // `split(' ')[1]` is undefined for a bare "Bearer" header, so reject on the
  // token being absent BEFORE calling jwt.verify — otherwise a malformed header
  // produced two responses and threw ERR_HTTP_HEADERS_SENT.
  const token = header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token', code: 'NO_TOKEN' });
  }

  // A missing JWT_SECRET makes EVERY request look like a bad token. Call that
  // out as a server misconfiguration instead of blaming the customer's session.
  if (!process.env.JWT_SECRET) {
    console.error('[Auth] JWT_SECRET is not configured. Set it in backend/.env and restart the server.');
    return res.status(500).json({ message: 'Server authentication is not configured. Please contact support.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Log the REAL reason. This catch used to swallow everything, so a live
    // "token failed" report could not be told apart from an expired session,
    // a wrong secret, or a malformed token.
    const expired = error && error.name === 'TokenExpiredError';
    console.warn(
      `[Auth] JWT verify failed for ${req.method} ${req.originalUrl} (${expired ? 'expired' : (error && error.name) || 'invalid'}): ${error && error.message}`
    );
    return res.status(401).json({
      message: expired ? 'Session expired. Please log in again.' : 'Not authorized, token failed',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
    });
  }

  try {
    // password is select:false on the schema, so this query cannot leak it.
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists', code: 'USER_NOT_FOUND' });
    }
    // role is always re-read from the database on every request, so a role
    // change takes effect immediately and role cannot be forged via the token.
    req.user = user;
    return next();
  } catch (error) {
    // A failed user lookup is a database problem, not a bad token — answering
    // 401 here made an outage look like the customer being at fault.
    console.error('[Auth] User lookup failed:', error.message);
    return res.status(500).json({ message: 'Could not verify your session. Please try again.' });
  }
};

module.exports = { protect };