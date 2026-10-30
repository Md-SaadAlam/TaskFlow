const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { TASK_STATUSES, TASK_PRIORITIES, PRIORITY_RANK } = require('../utils/constants');
const { startOfTodayUTC, addDays } = require('../utils/dates');
const { logActivity, touchProject } = require('../utils/activity');
const {
  isAdminRole,
  getProjectForUser,
  getTaskForUser,
  getUserWorkspaceIds,
  getWorkspaceMembers,
  isWorkspaceMember,
} = require('../utils/access');
const {
  isValidId,
  requireString,
  optionalString,
  validateOneOf,
  parseOptionalDate,
  queryString,
  escapeRegex,
} = require('../utils/validators');

const POPULATE_FIELDS = [
  { path: 'assignee', select: 'name email' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'project', select: 'name' },
];

// Sorts in JavaScript so we can rank priorities (Low < Medium < High < Urgent) and keep empty due dates last.
function sortTasks(tasks, sort, order) {
  const direction = order === 'asc' ? 1 : -1;
  tasks.sort((a, b) => {
    if (sort === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return (new Date(a.dueDate) - new Date(b.dueDate)) * direction;
    }
    if (sort === 'priority') return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * direction;
    return (new Date(a.createdAt) - new Date(b.createdAt)) * direction;
  });
  return tasks;
}

// GET /api/tasks?project=&status=&priority=&assignee=&search=&due=&sort=&order=
// Without ?project= it returns tasks from every workspace the user belongs to.
const listTasks = asyncHandler(async (req, res) => {
  const conditions = [];

  const projectParam = queryString(req.query.project);
  if (projectParam) {
    if (!isValidId(projectParam)) throw new ApiError(400, 'Invalid project id.');
    const { project } = await getProjectForUser(projectParam, req.user._id); // membership check
    conditions.push({ project: project._id });
  } else {
    conditions.push({ workspace: { $in: await getUserWorkspaceIds(req.user._id) } });
  }

  const status = queryString(req.query.status);
  if (status) conditions.push({ status: validateOneOf(status, TASK_STATUSES, 'Status') });

  const priority = queryString(req.query.priority);
  if (priority) conditions.push({ priority: validateOneOf(priority, TASK_PRIORITIES, 'Priority') });

  const assignee = queryString(req.query.assignee);
  if (assignee === 'me') conditions.push({ assignee: req.user._id });
  else if (assignee === 'unassigned') conditions.push({ assignee: null });
  else if (assignee) {
    if (!isValidId(assignee)) throw new ApiError(400, 'Invalid assignee id.');
    conditions.push({ assignee });
  }

  const search = queryString(req.query.search);
  if (search) conditions.push({ title: { $regex: escapeRegex(search), $options: 'i' } });

  const due = queryString(req.query.due);
  const today = startOfTodayUTC();
  if (due === 'overdue') {
    conditions.push({ dueDate: { $lt: today } }, { status: { $ne: 'Done' } });
  } else if (due === 'today') {
    conditions.push({ dueDate: { $gte: today, $lt: addDays(today, 1) } });
  } else if (due === 'week') {
    conditions.push({ dueDate: { $gte: today, $lt: addDays(today, 8) } });
  } else if (due === 'none') {
    conditions.push({ dueDate: null });
  } else if (due) {
    throw new ApiError(400, 'Due filter must be one of: overdue, today, week, none.');
  }

  const sort = queryString(req.query.sort) || 'createdAt';
  if (!['dueDate', 'priority', 'createdAt'].includes(sort)) {
    throw new ApiError(400, 'Sort must be one of: dueDate, priority, createdAt.');
  }
  // Sensible default direction: soonest due date first, highest priority first, newest first.
  const defaultOrder = sort === 'dueDate' ? 'asc' : 'desc';
  const order = queryString(req.query.order) === 'asc' || queryString(req.query.order) === 'desc'
    ? queryString(req.query.order)
    : defaultOrder;

  const tasks = await Task.find({ $and: conditions })
    .sort({ createdAt: -1 })
    .limit(500)
    .populate('assignee', 'name email')
    .populate('project', 'name')
    .lean();

  res.json({ success: true, tasks: sortTasks(tasks, sort, order) });
});

// Checks and applies the fields that were sent, then saves and writes activity records.
// Used by both PUT /:taskId and PATCH /:taskId/status so the rules live in one place.
async function applyTaskUpdates(task, body, workspace, user) {
  const changedFields = [];
  let statusChange = null;
  let assigneeChanged = false;

  if (body.title !== undefined) {
    const title = requireString(body.title, 'Title', { max: 120 });
    if (title !== task.title) { task.title = title; changedFields.push('title'); }
  }
  if (body.description !== undefined) {
    const description = optionalString(body.description, 'Description', { max: 2000 });
    if (description !== task.description) { task.description = description; changedFields.push('description'); }
  }
  if (body.priority !== undefined) {
    const priority = validateOneOf(body.priority, TASK_PRIORITIES, 'Priority');
    if (priority !== task.priority) { task.priority = priority; changedFields.push(`priority (${priority})`); }
  }
  const dueDate = parseOptionalDate(body.dueDate, 'Due date');
  if (dueDate !== undefined) {
    const oldTime = task.dueDate ? task.dueDate.getTime() : null;
    const newTime = dueDate ? dueDate.getTime() : null;
    if (oldTime !== newTime) { task.dueDate = dueDate; changedFields.push('due date'); }
  }
  if (body.status !== undefined) {
    const status = validateOneOf(body.status, TASK_STATUSES, 'Status');
    if (status !== task.status) {
      statusChange = { from: task.status, to: status };
      task.status = status;
      task.completedAt = status === 'Done' ? new Date() : null;
    }
  }
  if (body.assignee !== undefined) {
    const newAssignee = body.assignee === '' ? null : body.assignee;
    if (newAssignee !== null) {
      if (!isValidId(newAssignee)) throw new ApiError(400, 'Invalid assignee.');
      if (!isWorkspaceMember(workspace, newAssignee)) {
        throw new ApiError(400, 'The assignee must be a member of this workspace.');
      }
    }
    const oldAssignee = task.assignee ? task.assignee.toString() : null;
    if (oldAssignee !== newAssignee) { task.assignee = newAssignee; assigneeChanged = true; }
  }

  if (!task.isModified()) return; // nothing changed

  task.updatedBy = user._id;
  await task.save();
  await touchProject(task.project);

  const base = { workspace: task.workspace, project: task.project, task: task._id, user: user._id };
  if (statusChange) {
    await logActivity({ ...base, action: 'status_changed', message: `moved "${task.title}" from ${statusChange.from} to ${statusChange.to}` });
  }
  if (assigneeChanged) {
    let message = `unassigned "${task.title}"`;
    if (task.assignee) {
      const person = await User.findById(task.assignee).select('name');
      message = `assigned "${task.title}" to ${person ? person.name : 'a team member'}`;
    }
    await logActivity({ ...base, action: 'task_assigned', message });
  }
  if (changedFields.length > 0) {
    await logActivity({ ...base, action: 'task_updated', message: `updated ${changedFields.join(', ')} on "${task.title}"` });
  }
}

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  if (!isValidId(req.body.project)) throw new ApiError(400, 'Please choose a project.');
  const { project, workspace } = await getProjectForUser(req.body.project, req.user._id);

  const title = requireString(req.body.title, 'Title', { max: 120 });
  const description = optionalString(req.body.description, 'Description', { max: 2000 });
  const status = req.body.status === undefined ? 'To Do' : validateOneOf(req.body.status, TASK_STATUSES, 'Status');
  const priority = req.body.priority === undefined ? 'Medium' : validateOneOf(req.body.priority, TASK_PRIORITIES, 'Priority');
  const dueDate = parseOptionalDate(req.body.dueDate, 'Due date') || null;

  let assignee = null;
  if (req.body.assignee) {
    if (!isValidId(req.body.assignee) || !isWorkspaceMember(workspace, req.body.assignee)) {
      throw new ApiError(400, 'The assignee must be a member of this workspace.');
    }
    assignee = req.body.assignee;
  }

  const task = await Task.create({
    title,
    description,
    project: project._id,
    workspace: workspace._id,
    status,
    priority,
    dueDate,
    completedAt: status === 'Done' ? new Date() : null,
    assignee,
    createdBy: req.user._id,
  });
  await touchProject(project._id);

  const base = { workspace: workspace._id, project: project._id, task: task._id, user: req.user._id };
  await logActivity({ ...base, action: 'task_created', message: `created task "${title}"` });
  if (assignee) {
    const person = await User.findById(assignee).select('name');
    await logActivity({ ...base, action: 'task_assigned', message: `assigned "${title}" to ${person ? person.name : 'a team member'}` });
  }

  await task.populate(POPULATE_FIELDS);
  res.status(201).json({ success: true, task });
});

// GET /api/tasks/:taskId
const getTask = asyncHandler(async (req, res) => {
  const { task, workspace, role } = await getTaskForUser(req.params.taskId, req.user._id);
  const members = await getWorkspaceMembers(workspace);
  await task.populate(POPULATE_FIELDS);

  res.json({
    success: true,
    task,
    members,
    myRole: role,
    canDelete: isAdminRole(role) || task.createdBy._id.toString() === req.user._id.toString(),
  });
});

// PUT /api/tasks/:taskId  (any workspace member)
const updateTask = asyncHandler(async (req, res) => {
  const { task, workspace } = await getTaskForUser(req.params.taskId, req.user._id);
  await applyTaskUpdates(task, req.body, workspace, req.user);
  await task.populate(POPULATE_FIELDS);
  res.json({ success: true, task });
});

// PATCH /api/tasks/:taskId/status  { status }  (used by the Kanban board)
const updateTaskStatus = asyncHandler(async (req, res) => {
  if (req.body.status === undefined) throw new ApiError(400, 'Status is required.');
  const { task, workspace } = await getTaskForUser(req.params.taskId, req.user._id);
  await applyTaskUpdates(task, { status: req.body.status }, workspace, req.user); // only the status is applied
  await task.populate(POPULATE_FIELDS);
  res.json({ success: true, task });
});

// DELETE /api/tasks/:taskId  (owner/admin or the task creator)
const deleteTask = asyncHandler(async (req, res) => {
  const { task, role } = await getTaskForUser(req.params.taskId, req.user._id);
  const isCreator = task.createdBy.toString() === req.user._id.toString();
  if (!isAdminRole(role) && !isCreator) {
    throw new ApiError(403, 'Only the owner, an admin, or the task creator can delete this task.');
  }

  await Comment.deleteMany({ task: task._id });
  await Activity.deleteMany({ task: task._id });
  await task.deleteOne();
  await touchProject(task.project);
  await logActivity({
    workspace: task.workspace,
    project: task.project,
    user: req.user._id,
    action: 'task_deleted',
    message: `deleted task "${task.title}"`,
  });

  res.json({ success: true, message: 'Task deleted.' });
});

module.exports = { listTasks, createTask, getTask, updateTask, updateTaskStatus, deleteTask };
