const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Runs before every protected route. Reads "Authorization: Bearer <token>", verifies it,
// loads the user from the database and attaches it to req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'You are not logged in. Please log in to continue.');
  }

  let payload;
  try {
    payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'The account for this session no longer exists.');

  req.user = user;
  next();
});

module.exports = { protect };
