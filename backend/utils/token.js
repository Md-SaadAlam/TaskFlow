const jwt = require('jsonwebtoken');

// Creates a signed login token that contains only the user's id.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  });
}

module.exports = { signToken };
