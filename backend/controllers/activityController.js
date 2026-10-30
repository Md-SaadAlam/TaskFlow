const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getProjectForUser, getTaskForUser } = require('../utils/access');
const { isValidId, queryString } = require('../utils/validators');

// GET /api/activity?project=<id>  or  ?task=<id>   (&limit=20)
const getActivity = asyncHandler(async (req, res) => {
  const projectId = queryString(req.query.project);
  const taskId = queryString(req.query.task);
  const limit = Math.min(Math.max(parseInt(queryString(req.query.limit), 10) || 20, 1), 100);

  let filter;
  if (taskId) {
    if (!isValidId(taskId)) throw new ApiError(400, 'Invalid task id.');
    const { task } = await getTaskForUser(taskId, req.user._id);
    filter = { task: task._id };
  } else if (projectId) {
    if (!isValidId(projectId)) throw new ApiError(400, 'Invalid project id.');
    const { project } = await getProjectForUser(projectId, req.user._id);
    filter = { project: project._id };
  } else {
    throw new ApiError(400, 'Provide either ?project=<id> or ?task=<id>.');
  }

  const activity = await Activity.find(filter).sort({ createdAt: -1 }).limit(limit).populate('user', 'name');
  res.json({ success: true, activity });
});

module.exports = { getActivity };
