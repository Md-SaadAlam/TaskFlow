const TASK_STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3, Urgent: 4 };

// "owner" is created automatically for whoever creates the workspace.
const WORKSPACE_ROLES = ['owner', 'admin', 'member'];
const ASSIGNABLE_ROLES = ['admin', 'member'];

const ACTIVITY_ACTIONS = [
  'task_created',
  'task_updated',
  'status_changed',
  'task_assigned',
  'comment_added',
  'task_deleted',
];

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  PRIORITY_RANK,
  WORKSPACE_ROLES,
  ASSIGNABLE_ROLES,
  ACTIVITY_ACTIONS,
};
