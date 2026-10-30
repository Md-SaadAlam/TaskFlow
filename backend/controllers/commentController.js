const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getTaskForUser, isAdminRole } = require('../utils/access');
const { logActivity, touchProject } = require('../utils/activity');
const { requireString } = require('../utils/validators');

// GET /api/tasks/:taskId/comments
const getComments = asyncHandler(async (req, res) => {
  const { task, role } = await getTaskForUser(req.params.taskId, req.user._id);
  const comments = await Comment.find({ task: task._id }).sort({ createdAt: 1 }).populate('author', 'name');
  res.json({ success: true, comments, myRole: role });
});

// POST /api/tasks/:taskId/comments  { text }
const addComment = asyncHandler(async (req, res) => {
  const { task } = await getTaskForUser(req.params.taskId, req.user._id);
  const text = requireString(req.body.text, 'Comment', { max: 1000 });

  const comment = await Comment.create({ task: task._id, author: req.user._id, text });
  await comment.populate('author', 'name');
  await touchProject(task.project);
  await logActivity({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    user: req.user._id,
    action: 'comment_added',
    message: `commented on "${task.title}"`,
  });

  res.status(201).json({ success: true, comment });
});

// DELETE /api/tasks/:taskId/comments/:commentId  (author, or owner/admin)
const deleteComment = asyncHandler(async (req, res) => {
  const { task, role } = await getTaskForUser(req.params.taskId, req.user._id);
  const comment = await Comment.findOne({ _id: req.params.commentId, task: task._id });
  if (!comment) throw new ApiError(404, 'Comment not found.');

  const isAuthor = comment.author.toString() === req.user._id.toString();
  if (!isAuthor && !isAdminRole(role)) {
    throw new ApiError(403, 'You can only delete your own comments.');
  }

  await comment.deleteOne();
  res.json({ success: true, message: 'Comment deleted.' });
});

module.exports = { getComments, addComment, deleteComment };
