const User = require('../models/User');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');
const { requireString, validateEmail, validatePassword, validateOneOf } = require('../utils/validators');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name, 'Name', { min: 2, max: 50 });
  const email = validateEmail(req.body.email);
  const password = validatePassword(req.body.password);
  const accountType = req.body.accountType === undefined ? 'employee' : req.body.accountType;
  if (!['company', 'employee'].includes(accountType)) throw new ApiError(400, 'Choose a company or employee account.');
  const companyName = accountType === 'company'
    ? requireString(req.body.companyName, 'Company name', { min: 2, max: 60 })
    : '';

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  // The password is hashed automatically by the User model before saving.
  const user = await User.create({ name, email, password, accountType, companyName });
  if (accountType === 'company') {
    try {
      await Workspace.create({
        name: companyName,
        description: `${companyName} company workspace`,
        owner: user._id,
        members: [{ user: user._id, role: 'owner' }],
      });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  }

  res.status(201).json({ success: true, token: signToken(user._id), user });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = validateEmail(req.body.email);
  const { password } = req.body;
  if (typeof password !== 'string' || password.length === 0) {
    throw new ApiError(400, 'Password is required.');
  }

  // +password is needed because the password field is hidden by default.
  const user = await User.findOne({ email }).select('+password');
  const passwordOk = user ? await user.matchPassword(password) : false;

  // Same message for "no such user" and "wrong password" so attackers cannot discover registered emails.
  if (!passwordOk) throw new ApiError(401, 'Invalid email or password.');
  if (req.body.accountType !== undefined) {
    const accountType = validateOneOf(req.body.accountType, ['company', 'employee'], 'Account type');
    if (accountType !== user.accountType) {
      throw new ApiError(403, `This is a ${user.accountType} account. Choose the matching sign-in option.`);
    }
  }

  res.json({ success: true, token: signToken(user._id), user });
});

// GET /api/auth/me  (used by the frontend to restore a login after a page refresh)
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, getMe };
