// Authorization helpers. EVERY controller uses these so the backend (not the UI) decides who may do what.
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('./ApiError');

const isAdminRole = (role) => role === 'owner' || role === 'admin';

// Loads a workspace and confirms the user is a member. Returns the workspace and the user's role.
async function getWorkspaceForUser(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new ApiError(404, 'Workspace not found.');

  const member = workspace.members.find((m) => m.user.toString() === userId.toString());
  if (!member) throw new ApiError(403, 'You do not have access to this workspace.');

  return { workspace, role: member.role };
}

// Project -> its workspace -> membership check.
async function getProjectForUser(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found.');
  const { workspace, role } = await getWorkspaceForUser(project.workspace, userId);
  return { project, workspace, role };
}

// Task -> its workspace -> membership check.
async function getTaskForUser(taskId, userId) {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found.');
  const { workspace, role } = await getWorkspaceForUser(task.workspace, userId);
  return { task, workspace, role };
}

function isWorkspaceMember(workspace, userId) {
  return workspace.members.some((m) => m.user.toString() === userId.toString());
}

// Ids of all workspaces the user belongs to.
async function getUserWorkspaceIds(userId) {
  const workspaces = await Workspace.find({ 'members.user': userId }).select('_id');
  return workspaces.map((w) => w._id);
}

// Members of a workspace as simple objects { _id, name, email, role } (used for assignee dropdowns).
async function getWorkspaceMembers(workspace) {
  await workspace.populate('members.user', 'name email');
  return workspace.members
    .filter((m) => m.user)
    .map((m) => ({ _id: m.user._id, name: m.user.name, email: m.user.email, role: m.role }));
}

module.exports = {
  isAdminRole,
  getWorkspaceForUser,
  getProjectForUser,
  getTaskForUser,
  isWorkspaceMember,
  getUserWorkspaceIds,
  getWorkspaceMembers,
};
