// Small hand-written validators so the rules are easy to read and explain.
const ApiError = require('./ApiError');

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidId = (value) => typeof value === 'string' && OBJECT_ID_REGEX.test(value);

// Required text field: must be a string, trimmed, and within the length limits.
function requireString(value, label, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') throw new ApiError(400, `${label} is required.`);
  const text = value.trim();
  if (text.length < min) {
    throw new ApiError(400, min === 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`);
  }
  if (text.length > max) throw new ApiError(400, `${label} must be at most ${max} characters.`);
  return text;
}

// Optional text field: returns '' when missing, throws if it is not a string.
function optionalString(value, label, { max = 1000 } = {}) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new ApiError(400, `${label} must be text.`);
  const text = value.trim();
  if (text.length > max) throw new ApiError(400, `${label} must be at most ${max} characters.`);
  return text;
}

function validateEmail(value) {
  const email = requireString(value, 'Email', { max: 100 }).toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw new ApiError(400, 'Please enter a valid email address.');
  return email;
}

function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }
  if (value.length > 72) throw new ApiError(400, 'Password must be at most 72 characters.'); // bcrypt limit
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new ApiError(400, 'Password must contain at least one letter and one number.');
  }
  return value;
}

function validateOneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new ApiError(400, `${label} must be one of: ${allowed.join(', ')}.`);
  }
  return value;
}

// Dates: undefined = "not sent" (leave unchanged), null/'' = "clear it", otherwise a valid Date.
function parseOptionalDate(value, label) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new ApiError(400, `${label} is not a valid date.`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `${label} is not a valid date.`);
  return date;
}

// Reads a query-string value safely (query params can be arrays/objects, we only accept text).
function queryString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Escapes characters like . * + ( so user search text cannot act as a regex pattern.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  isValidId,
  requireString,
  optionalString,
  validateEmail,
  validatePassword,
  validateOneOf,
  parseOptionalDate,
  queryString,
  escapeRegex,
};
