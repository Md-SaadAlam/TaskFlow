const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { requireString, validatePassword } = require('../utils/validators');

// PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name, 'Name', { min: 2, max: 50 });
  req.user.name = name;
  if (req.body.companyName !== undefined) {
    if (req.user.accountType !== 'company') throw new ApiError(403, 'Only company accounts can edit company details.');
    req.user.companyName = requireString(req.body.companyName, 'Company name', { min: 2, max: 60 });
  }
  await req.user.save();
  res.json({ success: true, user: req.user });
});

// PUT /api/users/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw new ApiError(400, 'Current password is required.');
  }
  validatePassword(newPassword);

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = newPassword; // hashed by the model's pre-save hook
  await user.save();
  res.json({ success: true, message: 'Password updated.' });
});

module.exports = { updateProfile, changePassword };
