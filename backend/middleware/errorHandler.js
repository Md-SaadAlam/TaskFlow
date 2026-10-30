const ApiError = require('../utils/ApiError');

// Runs when no route matched.
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// One place that turns every error into a clean JSON response.
// Stack traces and internal details are only written to the server log, never sent to the user.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = 500;
  let message = 'Something went wrong on the server.';

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid value provided.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That value is already in use.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  } else {
    console.error(err); // visible in the terminal / Render logs only
  }

  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
