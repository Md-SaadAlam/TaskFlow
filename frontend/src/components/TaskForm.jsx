import { useState } from 'react';
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants';
import { toDateInputValue } from '../utils/format';

// Used for both "New task" (no task prop) and "Edit task" (task prop provided).
export default function TaskForm({ task, members, onSubmit, onCancel, submitting, error }) {
  const [values, setValues] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'To Do',
    priority: task?.priority || 'Medium',
    dueDate: toDateInputValue(task?.dueDate),
    assignee: task?.assignee?._id || '',
  });

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...values,
      title: values.title.trim(),
      dueDate: values.dueDate || null, // null clears the date
      assignee: values.assignee || null, // null means unassigned
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <div>
        <label htmlFor="task-title" className="label">Title</label>
        <input id="task-title" name="title" className="input" value={values.title} onChange={handleChange} maxLength={120} required autoFocus />
      </div>
      <div>
        <label htmlFor="task-description" className="label">Description</label>
        <textarea id="task-description" name="description" rows={4} className="input" value={values.description} onChange={handleChange} maxLength={2000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="task-status" className="label">Status</label>
          <select id="task-status" name="status" className="input" value={values.status} onChange={handleChange}>
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="task-priority" className="label">Priority</label>
          <select id="task-priority" name="priority" className="input" value={values.priority} onChange={handleChange}>
            {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="task-due" className="label">Due date</label>
          <input id="task-due" name="dueDate" type="date" className="input" value={values.dueDate} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="task-assignee" className="label">Assign to</label>
          <select id="task-assignee" name="assignee" className="input" value={values.assignee} onChange={handleChange}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
