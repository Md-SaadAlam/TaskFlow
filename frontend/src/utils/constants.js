export const TASK_STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Tailwind classes for each status/priority (kept here so colors stay consistent everywhere).
export const STATUS_STYLES = {
  'To Do': { badge: 'bg-slate-100 text-slate-700', bar: 'bg-slate-400', top: 'border-t-slate-400' },
  'In Progress': { badge: 'bg-sky-100 text-sky-800', bar: 'bg-sky-500', top: 'border-t-sky-500' },
  'In Review': { badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', top: 'border-t-amber-500' },
  Done: { badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500', top: 'border-t-emerald-500' },
};

export const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};

export const DEFAULT_FILTERS = {
  search: '',
  status: '',
  priority: '',
  assignee: '',
  due: '',
  sort: 'createdAt',
};
