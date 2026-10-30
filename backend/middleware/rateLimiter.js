const rateLimit = require('express-rate-limit');

// Limits login/register attempts per IP to slow down password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes and try again.' },
});

module.exports = { authLimiter };
