import { useState } from 'react';
import { toDateInputValue } from '../utils/format';

// Used for "New project" and "Edit project".
// Pass `workspaces` to show a workspace picker (only when creating from the Projects page).
export default function ProjectForm({ project, workspaces, onSubmit, onCancel, submitting, error }) {
  const [values, setValues] = useState({
    workspace: workspaces?.[0]?._id || '',
    name: project?.name || '',
    description: project?.description || '',
    startDate: toDateInputValue(project?.startDate),
    dueDate: toDateInputValue(project?.dueDate),
  });

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...values,
      name: values.name.trim(),
      startDate: values.startDate || null,
      dueDate: values.dueDate || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      {workspaces && (
        <div>
          <label htmlFor="project-workspace" className="label">Workspace</label>
          <select id="project-workspace" name="workspace" className="input" value={values.workspace} onChange={handleChange} required>
            {workspaces.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="project-name" className="label">Project name</label>
        <input id="project-name" name="name" className="input" value={values.name} onChange={handleChange} maxLength={80} required autoFocus />
      </div>
      <div>
        <label htmlFor="project-description" className="label">Description</label>
        <textarea id="project-description" name="description" rows={3} className="input" value={values.description} onChange={handleChange} maxLength={1000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="project-start" className="label">Start date</label>
          <input id="project-start" name="startDate" type="date" className="input" value={values.startDate} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="project-due" className="label">Due date</label>
          <input id="project-due" name="dueDate" type="date" className="input" value={values.dueDate} onChange={handleChange} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : project ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  );
}
