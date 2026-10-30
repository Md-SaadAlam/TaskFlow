import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectApi, taskApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import TaskFilters from '../components/TaskFilters';
import KanbanBoard from '../components/KanbanBoard';
import Icon from '../components/Icons';
import { DEFAULT_FILTERS } from '../utils/constants';
import { buildTaskParams } from '../utils/taskParams';

export default function ProjectBoard() {
  const { projectId } = useParams();
  const { showSuccess, showError } = useToast();

  const [info, setInfo] = useState(null); // { project, workspace, members }
  const [infoError, setInfoError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  // Project name + team members (needed for the filter and the "New task" form).
  useEffect(() => {
    projectApi
      .get(projectId)
      .then((data) => setInfo(data))
      .catch((err) => setInfoError(getErrorMessage(err)));
  }, [projectId]);

  // Real tasks from MongoDB, re-fetched when filters change.
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
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

  // Called when a card is dropped on a column OR its status dropdown is changed.
  async function handleMoveTask(task, newStatus) {
    if (task.status === newStatus) return;
    const previousTasks = tasks;
    // Update the screen immediately, then save. If saving fails we put the card back.
    setTasks((current) => current.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)));
    try {
      await taskApi.updateStatus(task._id, newStatus);
      showSuccess(`Moved "${task.title}" to ${newStatus}.`);
    } catch (err) {
      setTasks(previousTasks);
      showError(getErrorMessage(err, 'Could not move the task.'));
    }
  }

  async function handleCreateTask(values) {
    setBusy(true);
    setFormError('');
    try {
      await taskApi.create({ ...values, project: projectId });
      showSuccess('Task created.');
      setShowForm(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (infoError) return <ErrorMessage message={infoError} />;
  if (!info) return <Loading label="Loading board..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/projects/${projectId}`} className="text-sm font-medium text-brand-700 hover:underline">
            {info.project.name} (project details)
          </Link>
          <h1 className="page-title mt-1">Kanban board</h1>
          <p className="mt-1 text-sm text-slate-500">Drag cards between columns, or use the status dropdown on a card.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setFormError(''); setShowForm(true); }}>
          <Icon name="plus" className="h-4 w-4" /> New task
        </button>
      </div>

      <TaskFilters filters={filters} onChange={setFilters} members={info.members} />

      {tasksError && <ErrorMessage message={tasksError} onRetry={() => setReloadKey((k) => k + 1)} />}
      {tasksLoading ? <Loading label="Loading tasks..." /> : <KanbanBoard tasks={tasks} onMoveTask={handleMoveTask} />}

      {showForm && (
        <Modal title="New task" onClose={() => setShowForm(false)} wide>
          <TaskForm members={info.members} onSubmit={handleCreateTask} onCancel={() => setShowForm(false)} submitting={busy} error={formError} />
        </Modal>
      )}
    </div>
  );
}
