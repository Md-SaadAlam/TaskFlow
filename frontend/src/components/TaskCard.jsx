import { Link } from 'react-router-dom';
import { PriorityBadge } from './Badges';
import Avatar from './Avatar';
import { TASK_STATUSES } from '../utils/constants';
import { formatDate, isOverdue } from '../utils/format';

// One card on the Kanban board. It can be dragged to another column,
// or the status dropdown can be used (works on touch screens where drag-and-drop does not).
export default function TaskCard({ task, onStatusChange }) {
  const overdue = isOverdue(task);

  function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', task._id); // the column reads this id when the card is dropped
    event.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div draggable onDragStart={handleDragStart} className="glass-sm cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing">
      <Link to={`/tasks/${task._id}`} draggable={false} className="block text-sm font-semibold text-slate-900 hover:text-brand-700">
        {task.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <span className={`text-xs ${overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
          {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
          {overdue && ' (overdue)'}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {task.assignee ? (
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
            <Avatar name={task.assignee.name} />
            <span className="truncate">{task.assignee.name}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}
        <select
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value)}
          aria-label={`Status of ${task.title}`}
          className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-700"
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
