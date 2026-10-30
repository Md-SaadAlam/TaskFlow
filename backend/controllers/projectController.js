const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { withProgress } = require('../utils/progress');
const {
  getWorkspaceForUser,
  getProjectForUser,
  getUserWorkspaceIds,
  getWorkspaceMembers,
  isAdminRole,
} = require('../utils/access');
const {
  isValidId,
  requireString,
  optionalString,
  parseOptionalDate,
  queryString,
  escapeRegex,
} = require('../utils/validators');

function checkDateOrder(startDate, dueDate) {
  if (startDate && dueDate && dueDate < startDate) {
    throw new ApiError(400, 'Due date cannot be before the start date.');
  }
}

// GET /api/projects?workspace=<id>&search=<text>
const listProjects = asyncHandler(async (req, res) => {
  let workspaceIds = await getUserWorkspaceIds(req.user._id);

  const workspaceParam = queryString(req.query.workspace);
  if (workspaceParam) {
    if (!isValidId(workspaceParam)) throw new ApiError(400, 'Invalid workspace id.');
    if (!workspaceIds.some((id) => id.toString() === workspaceParam)) {
      throw new ApiError(403, 'You do not have access to this workspace.');
    }
    workspaceIds = [workspaceParam];
  }

  const filter = { workspace: { $in: workspaceIds } };
  const search = queryString(req.query.search);
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };

  const projects = await Project.find(filter)
    .sort({ updatedAt: -1 })
    .limit(200)
    .populate('workspace', 'name');

  res.json({ success: true, projects: await withProgress(projects) });
});

// POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  if (!isValidId(req.body.workspace)) throw new ApiError(400, 'Please choose a workspace.');
  const { workspace } = await getWorkspaceForUser(req.body.workspace, req.user._id);

  const name = requireString(req.body.name, 'Project name', { max: 80 });
  const description = optionalString(req.body.description, 'Description', { max: 1000 });
  const startDate = parseOptionalDate(req.body.startDate, 'Start date') || null;
  const dueDate = parseOptionalDate(req.body.dueDate, 'Due date') || null;
  checkDateOrder(startDate, dueDate);

  const project = await Project.create({
    name,
    description,
    workspace: workspace._id,
    createdBy: req.user._id,
    startDate,
    dueDate,
  });

  res.status(201).json({ success: true, project });
});

// GET /api/projects/:projectId
const getProject = asyncHandler(async (req, res) => {
  const { project, workspace, role } = await getProjectForUser(req.params.projectId, req.user._id);
  const [withProgressData] = await withProgress([project]);
  const members = await getWorkspaceMembers(workspace);

  res.json({
    success: true,
    project: withProgressData,
    workspace: { _id: workspace._id, name: workspace.name },
    members,
    myRole: role,
    canDelete: isAdminRole(role) || project.createdBy.toString() === req.user._id.toString(),
  });
});

// PUT /api/projects/:projectId  (any workspace member)
const updateProject = asyncHandler(async (req, res) => {
  const { project } = await getProjectForUser(req.params.projectId, req.user._id);

  if (req.body.name !== undefined) project.name = requireString(req.body.name, 'Project name', { max: 80 });
  if (req.body.description !== undefined) {
    project.description = optionalString(req.body.description, 'Description', { max: 1000 });
  }
  const startDate = parseOptionalDate(req.body.startDate, 'Start date');
  const dueDate = parseOptionalDate(req.body.dueDate, 'Due date');
  if (startDate !== undefined) project.startDate = startDate;
  if (dueDate !== undefined) project.dueDate = dueDate;
  checkDateOrder(project.startDate, project.dueDate);

  await project.save();
  res.json({ success: true, project });
});

// DELETE /api/projects/:projectId  (owner/admin or the person who created the project)
const deleteProject = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectForUser(req.params.projectId, req.user._id);
  const isCreator = project.createdBy.toString() === req.user._id.toString();
  if (!isAdminRole(role) && !isCreator) {
    throw new ApiError(403, 'Only the owner, an admin, or the project creator can delete this project.');
  }

  const taskIds = await Task.distinct('_id', { project: project._id });
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true, message: 'Project deleted.' });
});

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject };
