const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
    accountType: { type: String, enum: ['company', 'employee'], default: 'employee', index: true },
    companyName: { type: String, trim: true, maxlength: 60, default: '' },
    // select: false means the password hash is NOT returned by queries unless we ask for it.
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

// Hash the password automatically whenever it is created or changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare a plain-text password with the stored hash (the document must be loaded with +password).
userSchema.methods.matchPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Never send the password hash or __v to the client, even by accident.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
