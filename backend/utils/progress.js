const Task = require('../models/Task');
const { TASK_STATUSES } = require('./constants');

// Returns { [projectId]: { total, done, percent, byStatus } } using one database query.
async function getProgressMap(projectIds) {
  const map = {};
  projectIds.forEach((id) => {
    const byStatus = {};
    TASK_STATUSES.forEach((status) => { byStatus[status] = 0; });
    map[id.toString()] = { total: 0, done: 0, percent: 0, byStatus };
  });

  if (projectIds.length === 0) return map;

  const rows = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ]);

  rows.forEach((row) => {
    const entry = map[row._id.project.toString()];
    if (!entry) return;
    entry.byStatus[row._id.status] = row.count;
    entry.total += row.count;
    if (row._id.status === 'Done') entry.done = row.count;
  });

  Object.values(map).forEach((entry) => {
    entry.percent = entry.total === 0 ? 0 : Math.round((entry.done / entry.total) * 100);
  });

  return map;
}

// Converts project documents to plain objects and adds a "progress" field.
async function withProgress(projects) {
  const progressMap = await getProgressMap(projects.map((p) => p._id));
  return projects.map((project) => {
    const plain = typeof project.toObject === 'function' ? project.toObject() : project;
    return { ...plain, progress: progressMap[plain._id.toString()] };
  });
}

module.exports = { getProgressMap, withProgress };
