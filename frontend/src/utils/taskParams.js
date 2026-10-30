// Converts the filter form values into query-string parameters for GET /api/tasks.
// Empty filters are left out so the backend does not filter on them.
export function buildTaskParams(projectId, filters) {
  const params = { project: projectId, sort: filters.sort };
  ['search', 'status', 'priority', 'assignee', 'due'].forEach((name) => {
    const value = typeof filters[name] === 'string' ? filters[name].trim() : '';
    if (value) params[name] = value;
  });
  return params;
}
