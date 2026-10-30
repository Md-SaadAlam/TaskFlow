import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { activityApi, projectApi, taskApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';
import TaskFilters from '../components/TaskFilters';
import ProgressBar from '../components/ProgressBar';
import ActivityList from '../components/ActivityList';
import Avatar from '../components/Avatar';
import Icon from '../components/Icons';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { DEFAULT_FILTERS, STATUS_STYLES, TASK_STATUSES } from '../utils/constants';
import { formatDate, isOverdue } from '../utils/format';
import { buildTaskParams } from '../utils/taskParams';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState(null); // { project, workspace, members, myRole, canDelete }
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  const [modal, setModal] = useState(null); // 'edit' | 'task' | null
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const [projectData, activityData] = await Promise.all([
        projectApi.get(projectId),
        activityApi.list({ project: projectId, limit: 10 }),
      ]);
      setData(projectData);
      setActivity(activityData.activity);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject, reloadKey]);

  // Reload the task list when filters change (short delay so typing in the search box is smooth).
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
      setTasksLoading(true);
      try {
        const result = await taskApi.list(buildTaskParams(projectId, filters));
        if (!ignore) {
          setTasks(result.tasks);
          setTasksError('');
        }
      } catch (err) {
        if (!ignore) setTasksError(getErrorMessage(err));
      } finally {
        if (!ignore) setTasksLoading(false);
      }
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [projectId, filters, reloadKey]);

  if (loading) return <Loading label="Loading project..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProject} />;

  const { project, workspace, members, canDelete } = data;
  const { progress } = project;

  async function handleEdit(values) {
    setBusy(true);
    setFormError('');
    try {
      await projectApi.update(projectId, values);
      showSuccess('Project updated.');
      setModal(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateTask(values) {
    setBusy(true);
    setFormError('');
    try {
      await taskApi.create({ ...values, project: projectId });
      showSuccess('Task created.');
      setModal(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await projectApi.remove(projectId);
      showSuccess('Project deleted.');
      navigate('/projects');
    } catch (err) {
      setConfirmDelete(false);
      setBusy(false);
      showError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/workspaces/${workspace._id}`} className="text-sm font-medium text-brand-700 hover:underline">{workspace.name}</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{project.description || 'No description.'}</p>
            <p className="mt-2 text-xs text-slate-500">
              Start: {formatDate(project.startDate)} &middot; Due: {formatDate(project.dueDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/projects/${projectId}/board`} className="btn-secondary">Open board</Link>
            <button type="button" className="btn-secondary" onClick={() => { setFormError(''); setModal('edit'); }}>Edit</button>
            {canDelete && <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>}
          </div>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-bold text-slate-900">Progress</h2>
        <div className="mt-3"><ProgressBar percent={progress.percent} /></div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          {TASK_STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].bar}`} />
              {status}: {progress.byStatus[status]}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Tasks</h2>
          <button type="button" className="btn-primary" onClick={() => { setFormError(''); setModal('task'); }}>
            <Icon name="plus" className="h-4 w-4" /> New task
          </button>
        </div>

        <TaskFilters filters={filters} onChange={setFilters} members={members} />

        {tasksError && <ErrorMessage message={tasksError} onRetry={() => setReloadKey((k) => k + 1)} />}
        {tasksLoading && tasks.length === 0 && <Loading label="Loading tasks..." />}

        {!tasksLoading && !tasksError && tasks.length === 0 && (
          JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) ? (
            <EmptyState title="No tasks match these filters" message="Try clearing a filter or searching for something else." />
          ) : (
            <EmptyState title="No tasks yet" message="Add the first task for this project." />
          )
        )}

        {tasks.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/tasks/${task._id}`} className="font-semibold text-slate-900 hover:text-brand-700">{task.title}</Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3">
                      {task.assignee ? (
                        <span className="flex items-center gap-2"><Avatar name={task.assignee.name} />{task.assignee.name}</span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${isOverdue(task) ? 'font-semibold text-red-600' : 'text-slate-600'}`}>
                      {task.dueDate ? formatDate(task.dueDate) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-base font-bold text-slate-900">Recent activity</h2>
        <ActivityList activity={activity} />
      </section>

      {modal === 'edit' && (
        <Modal title="Edit project" onClose={() => setModal(null)}>
          <ProjectForm project={project} onSubmit={handleEdit} onCancel={() => setModal(null)} submitting={busy} error={formError} />
        </Modal>
      )}
      {modal === 'task' && (
        <Modal title="New task" onClose={() => setModal(null)} wide>
          <TaskForm members={members} onSubmit={handleCreateTask} onCancel={() => setModal(null)} submitting={busy} error={formError} />
        </Modal>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this project?"
          message="This permanently deletes the project together with all of its tasks and comments. This cannot be undone."
          confirmLabel="Delete project"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={busy}
        />
      )}
    </div>
  );
}
