const mongoose = require('mongoose');
const { WORKSPACE_ROLES } = require('../utils/constants');

// Each member is a reference to a User plus a role inside this workspace.
const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: WORKSPACE_ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

workspaceSchema.index({ 'members.user': 1 }); // fast "which workspaces am I in?" lookups

module.exports = mongoose.model('Workspace', workspaceSchema);
