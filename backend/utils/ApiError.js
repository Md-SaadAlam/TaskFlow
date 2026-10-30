// An error that carries an HTTP status code, so controllers can simply `throw new ApiError(404, '...')`.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
