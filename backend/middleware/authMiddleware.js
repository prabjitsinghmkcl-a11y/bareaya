const jwt = require('jsonwebtoken');
const User = require('../model/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // `split(' ')[1]` is undefined for a bare "Bearer" header, so reject on the
  // token being absent BEFORE calling jwt.verify — otherwise a malformed header
  // produced two responses and threw ERR_HTTP_HEADERS_SENT.
  const token = header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // password is select:false on the schema, so this query cannot leak it.
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }
    // role is always re-read from the database on every request, so a role
    // change takes effect immediately and role cannot be forged via the token.
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };