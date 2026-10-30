// Express 4 does not catch errors thrown inside async functions.
// This wrapper forwards them to the error-handling middleware.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
