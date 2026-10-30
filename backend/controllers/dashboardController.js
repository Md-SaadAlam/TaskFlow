const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { withProgress } = require('../utils/progress');
const { startOfTodayUTC } = require('../utils/dates');
const { getUserWorkspaceIds, getWorkspaceForUser } = require('../utils/access');
const { isValidId, queryString } = require('../utils/validators');

// GET /api/workspaces/:workspaceId/analytics/task-report
const getWorkspaceTaskReport = asyncHandler(async (req, res) => {
  const { workspace } = await getWorkspaceForUser(req.params.workspaceId, req.user._id);
  const today = startOfTodayUTC();
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const weekEnd = new Date(today);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 1);
  const now = new Date();

  const [report] = await Task.aggregate([
    { $match: { workspace: workspace._id } },
    { $facet: {
      statuses: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      overdue: [{ $match: { status: { $ne: 'Done' }, dueDate: { $type: 'date', $lt: now } } }, { $count: 'count' }],
      last7Days: [
        { $match: { completedAt: { $gte: weekStart, $lt: weekEnd } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'UTC' } }, completed: { $sum: 1 } } },
      ],
    } },
  ]);

  const counts = { 'To Do': 0, 'In Progress': 0, 'In Review': 0, Done: 0 };
  (report?.statuses || []).forEach(({ _id, count }) => { counts[_id] = count; });
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const completedByDay = Object.fromEntries((report?.last7Days || []).map((row) => [row._id, row.completed]));
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setUTCDate(day.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    return { date, completed: completedByDay[date] || 0 };
  });

  res.json({ success: true, report: {
    total,
    done: counts.Done,
    inProgress: counts['In Progress'],
    todo: counts['To Do'],
    overdue: report?.overdue?.[0]?.count || 0,
    completionPercent: total === 0 ? 0 : Math.round((counts.Done / total) * 100),
    last7Days,
  } });
});

// GET /api/dashboard   (optional ?workspace=<id> to look at a single workspace)
// Every number is calculated from the database - nothing is hardcoded.
const getDashboard = asyncHandler(async (req, res) => {
  let workspaceIds = await getUserWorkspaceIds(req.user._id);

  const workspaceParam = queryString(req.query.workspace);
  if (workspaceParam) {
    if (!isValidId(workspaceParam) || !workspaceIds.some((id) => id.toString() === workspaceParam)) {
      throw new ApiError(403, 'You do not have access to this workspace.');
    }
    workspaceIds = workspaceIds.filter((id) => id.toString() === workspaceParam);
  }

  const today = startOfTodayUTC();
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const weekEnd = new Date(today);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 1);
  const taskScope = { workspace: { $in: workspaceIds } };

  const [totalProjects, statusRows, overdue, assignedToMe, recentProjects, upcoming, overdueTasks, completionRows] = await Promise.all([
    Project.countDocuments({ workspace: { $in: workspaceIds } }),
    Task.aggregate([
      { $match: taskScope },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ ...taskScope, status: { $ne: 'Done' }, dueDate: { $lt: today } }),
    Task.countDocuments({ ...taskScope, status: { $ne: 'Done' }, assignee: req.user._id }),
    Project.find({ workspace: { $in: workspaceIds } }).sort({ updatedAt: -1 }).limit(5).populate('workspace', 'name'),
    Task.find({ ...taskScope, status: { $ne: 'Done' }, dueDate: { $gte: today } })
      .sort({ dueDate: 1 }).limit(5).populate('project', 'name').populate('assignee', 'name'),
    Task.find({ ...taskScope, status: { $ne: 'Done' }, dueDate: { $lt: today } })
      .sort({ dueDate: 1 }).limit(5).populate('project', 'name').populate('assignee', 'name'),
    Task.aggregate([
      { $match: { ...taskScope, completedAt: { $gte: weekStart, $lt: weekEnd } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const completionByDate = Object.fromEntries(completionRows.map((row) => [row._id, row.count]));
  const weeklyCompletions = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setUTCDate(day.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    return { date, count: completionByDate[date] || 0 };
  });

  const counts = { 'To Do': 0, 'In Progress': 0, 'In Review': 0, Done: 0 };
  statusRows.forEach((row) => { counts[row._id] = row.count; });
  const totalTasks = Object.values(counts).reduce((sum, n) => sum + n, 0);

  res.json({
    success: true,
    stats: {
      totalProjects,
      totalTasks,
      todo: counts['To Do'],
      inProgress: counts['In Progress'],
      inReview: counts['In Review'],
      done: counts.Done,
      overdue,
      assignedToMe,
      completionPercent: totalTasks === 0 ? 0 : Math.round((counts.Done / totalTasks) * 100),
      completedThisWeek: weeklyCompletions.reduce((total, day) => total + day.count, 0),
    },
    recentProjects: await withProgress(recentProjects),
    upcomingDeadlines: upcoming,
    overdueTasks,
    weeklyCompletions,
  });
});

module.exports = { getDashboard, getWorkspaceTaskReport };
