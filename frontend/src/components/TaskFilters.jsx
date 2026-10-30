import { DEFAULT_FILTERS, TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants';

// Search + filter + sort controls. The parent page owns the "filters" object and re-fetches when it changes.
export default function TaskFilters({ filters, onChange, members = [] }) {
  const setFilter = (name, value) => onChange({ ...filters, [name]: value });
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="sm:col-span-2 lg:col-span-2">
        <label htmlFor="task-search" className="label">Search tasks</label>
        <input id="task-search" type="search" className="input" placeholder="Search by title" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
      </div>
      <div>
        <label htmlFor="filter-status" className="label">Status</label>
        <select id="filter-status" className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="filter-priority" className="label">Priority</label>
        <select id="filter-priority" className="input" value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}>
          <option value="">All</option>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="filter-assignee" className="label">Assigned to</label>
        <select id="filter-assignee" className="input" value={filters.assignee} onChange={(e) => setFilter('assignee', e.target.value)}>
          <option value="">Anyone</option>
          <option value="me">Me</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="filter-due" className="label">Due date</label>
        <select id="filter-due" className="input" value={filters.due} onChange={(e) => setFilter('due', e.target.value)}>
          <option value="">Any time</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Next 7 days</option>
          <option value="none">No due date</option>
        </select>
      </div>
      <div>
        <label htmlFor="filter-sort" className="label">Sort by</label>
        <select id="filter-sort" className="input" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
          <option value="createdAt">Newest first</option>
          <option value="dueDate">Due date (soonest)</option>
          <option value="priority">Priority (highest)</option>
        </select>
      </div>
      {isFiltered && (
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={() => onChange(DEFAULT_FILTERS)}>Clear filters</button>
        </div>
      )}
    </div>
  );
}
