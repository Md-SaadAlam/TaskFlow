const ApiError = require('../utils/ApiError');
const { isValidId } = require('../utils/validators');

// Used with router.param('taskId', validateObjectId): rejects malformed ids before any database call.
function validateObjectId(req, res, next, value) {
  if (!isValidId(value)) return next(new ApiError(400, 'Invalid id in the URL.'));
  return next();
}

module.exports = validateObjectId;
