const mongoose = require('mongoose');
const { ACTIVITY_ACTIONS } = require('../utils/constants');

// A simple log line such as: Priya moved "Design login page" from To Do to In Progress.
const activitySchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    message: { type: String, required: true, maxlength: 400 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
