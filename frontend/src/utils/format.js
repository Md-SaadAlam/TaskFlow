// Due dates are stored as calendar dates (00:00 UTC), so we display them in UTC to avoid "off by one day" bugs.
export function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Timestamps (when something happened) are shown in the viewer's local time.
export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// "2026-10-20T00:00:00.000Z" -> "2026-10-20" (the format <input type="date"> needs)
export function toDateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

// A task is overdue when its due date is before today (UTC calendar day) and it is not Done.
export function isOverdue(task) {
  if (!task.dueDate || task.status === 'Done') return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate.slice(0, 10) < today;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
