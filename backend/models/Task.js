const mongoose = require('mongoose');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../utils/constants');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    // The workspace is also stored on the task so access checks and dashboard queries are simple.
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    status: { type: String, enum: TASK_STATUSES, default: 'To Do' },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'Medium' },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
