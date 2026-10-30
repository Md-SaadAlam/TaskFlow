const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ASSIGNABLE_ROLES } = require('../utils/constants');
const { getWorkspaceForUser, isAdminRole, getWorkspaceMembers } = require('../utils/access');
const { requireString, optionalString, validateEmail, validateOneOf } = require('../utils/validators');

// GET /api/workspaces  - workspaces the logged-in user belongs to
const listWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({ 'members.user': req.user._id }).sort({ updatedAt: -1 });
  const ids = workspaces.map((w) => w._id);

  const projectCounts = await Project.aggregate([
    { $match: { workspace: { $in: ids } } },
    { $group: { _id: '$workspace', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  projectCounts.forEach((row) => { countMap[row._id.toString()] = row.count; });

  const result = workspaces.map((workspace) => {
    const me = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
    return {
      _id: workspace._id,
      name: workspace.name,
      description: workspace.description,
      memberCount: workspace.members.length,
      projectCount: countMap[workspace._id.toString()] || 0,
      myRole: me.role,
      updatedAt: workspace.updatedAt,
    };
  });

  res.json({ success: true, workspaces: result });
});

// POST /api/workspaces
const createWorkspace = asyncHandler(async (req, res) => {
  if (req.user.accountType !== 'company') {
    throw new ApiError(403, 'Company accounts create workspaces. Ask your company to invite you to its team.');
  }
  const name = requireString(req.body.name, 'Workspace name', { max: 60 });
  const description = optionalString(req.body.description, 'Description', { max: 300 });

  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }], // the creator becomes the owner
  });

  res.status(201).json({ success: true, workspace });
});

// GET /api/workspaces/:workspaceId
const getWorkspace = asyncHandler(async (req, res) => {
  const { workspace, role } = await getWorkspaceForUser(req.params.workspaceId, req.user._id);
  const members = await getWorkspaceMembers(workspace);

  res.json({
    success: true,
    workspace: {
      _id: workspace._id,
      name: workspace.name,
      description: workspace.description,
      owner: workspace.owner,
      createdAt: workspace.createdAt,
    },
    members,
    myRole: role,
  });
});

// PUT /api/workspaces/:workspaceId  (owner or admin)
const updateWorkspace = asyncHandler(async (req, res) => {
  const { workspace, role } = await getWorkspaceForUser(req.params.workspaceId, req.user._id);
  if (!isAdminRole(role)) throw new ApiError(403, 'Only the owner or an admin can edit the workspace.');

  if (req.body.name !== undefined) workspace.name = requireString(req.body.name, 'Workspace name', { max: 60 });
  if (req.body.description !== undefined) {
    workspace.description = optionalString(req.body.description, 'Description', { max: 300 });
  }
  await workspace.save();

  res.json({ success: true, workspace });
});

// DELETE /api/workspaces/:workspaceId  (owner only) - also removes everything inside it
const deleteWorkspace = asyncHandler(async (req, res) => {
  const { workspace, role } = await getWorkspaceForUser(req.params.workspaceId, req.user._id);
  if (role !== 'owner') throw new ApiError(403, 'Only the owner can delete the workspace.');

  const taskIds = await Task.distinct('_id', { workspace: workspace._id });
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ workspace: workspace._id });
  await Activity.deleteMany({ workspace: workspace._id });
  await Project.deleteMany({ workspace: workspace._id });
  await workspace.deleteOne();

  res.json({ success: true, message: 'Workspace deleted.' });
});

// POST /api/workspaces/:workspaceId/members  { email, role }  (owner or admin)
// Simple approach: the person must already be registered; we add them by email.
const addMember = asyncHandler(async (req, res) => {
  const { workspace, role } = await getWorkspaceForUser(req.params.workspaceId, req.user._id);
  if (!isAdminRole(role)) throw new ApiError(403, 'Only the owner or an admin can add members.');

  const email = validateEmail(req.body.email);
  const newRole = req.body.role === undefined ? 'member' : validateOneOf(req.body.role, ASSIGNABLE_ROLES, 'Role');
  if (newRole === 'admin' && role !== 'owner') {
    throw new ApiError(403, 'Only the owner can add another admin.');
  }

  const userToAdd = await User.findOne({ email });
  if (!userToAdd) {
    throw new ApiError(404, 'No registered user has that email. Ask them to create a TaskFlow account first.');
  }
  if (userToAdd.accountType !== 'employee') {
    throw new ApiError(400, 'Only employee accounts can be added as team members.');
  }
  if (workspace.members.some((m) => m.user.toString() === userToAdd._id.toString())) {
    throw new ApiError(409, 'That user is already a member of this workspace.');
  }

  workspace.members.push({ user: userToAdd._id, role: newRole });
  await workspace.save();

  res.status(201).json({ success: true, members: await getWorkspaceMembers(workspace) });
});

// PATCH /api/workspaces/:workspaceId/members/:userId  { role }  (owner only)
const updateMemberRole = asyncHandler(async (req, res) => {
  const { workspace, role } = await getWorkspaceForUser(req.params.workspaceId, req.user._id);
  if (role !== 'owner') throw new ApiError(403, 'Only the owner can change roles.');

  const newRole = validateOneOf(req.body.role, ASSIGNABLE_ROLES, 'Role');
  const target = workspace.members.find((m) => m.user.toString() === req.params.userId);
  if (!target) throw new ApiError(404, 'That user is not a member of this workspace.');
  if (target.role === 'owner') throw new ApiError(400, "The owner's role cannot be changed.");

  target.role = newRole;
  await workspace.save();

  res.json({ success: true, members: await getWorkspaceMembers(workspace) });
});

// DELETE /api/workspaces/:workspaceId/members/:userId
// Admins/owner can remove members. Any member can remove themselves (leave).
const removeMember = asyncHandler(async (req, res) => {
  const { workspace, role } = await getWorkspaceForUser(req.params.workspaceId, req.user._id);
  const targetId = req.params.userId;
  const target = workspace.members.find((m) => m.user.toString() === targetId);
  if (!target) throw new ApiError(404, 'That user is not a member of this workspace.');
  if (target.role === 'owner') throw new ApiError(400, 'The owner cannot be removed. Delete the workspace instead.');

  const isSelf = targetId === req.user._id.toString();
  if (!isSelf) {
    if (!isAdminRole(role)) throw new ApiError(403, 'Only the owner or an admin can remove members.');
    if (target.role === 'admin' && role !== 'owner') throw new ApiError(403, 'Only the owner can remove an admin.');
  }

  workspace.members = workspace.members.filter((m) => m.user.toString() !== targetId);
  await workspace.save();

  // Tasks assigned to the removed person become unassigned.
  await Task.updateMany({ workspace: workspace._id, assignee: targetId }, { $set: { assignee: null } });

  res.json({ success: true, message: isSelf ? 'You left the workspace.' : 'Member removed.' });
});

module.exports = {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  updateMemberRole,
  removeMember,
};
