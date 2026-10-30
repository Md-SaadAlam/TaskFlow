import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, workspaceApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ProgressBar from '../components/ProgressBar';
import { PriorityBadge } from '../components/Badges';
import { STATUS_STYLES, TASK_STATUSES } from '../utils/constants';
import { formatDate } from '../utils/format';

const TaskReport3D = lazy(() => import('../components/dashboard/TaskReport3D'));

function StatCard({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function TaskList({ tasks, emptyText }) {
  if (tasks.length === 0) return <p className="py-4 text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <li key={task._id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <Link to={`/tasks/${task._id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700">{task.title}</Link>
            <p className="truncate text-xs text-slate-500">{task.project?.name} &middot; due {formatDate(task.dueDate)}</p>
          </div>
          <PriorityBadge priority={task.priority} />
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState('');

  useEffect(() => {
    let cancelled = false;
    workspaceApi.list().then((result) => {
      if (!cancelled) {
        setWorkspaces(result.workspaces);
        setWorkspaceId((current) => current || result.workspaces[0]?._id || '');
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await dashboardApi.get());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading label="Loading your dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const { stats, recentProjects, upcomingDeadlines, overdueTasks } = data;
  const statusCounts = {
    'To Do': stats.todo,
    'In Progress': stats.inProgress,
    'In Review': stats.inReview,
    Done: stats.done,
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-heading">
        <div>
        <p className="pulse-kicker mb-2">{user.accountType === 'company' ? user.companyName : 'YOUR WORKSPACE'}</p>
        <h1 className="dashboard-greeting">{user.accountType === 'company' ? 'A clearer view of work.' : `Welcome back, ${user.name.split(' ')[0]}.`}</h1>
        <p className="dashboard-subtitle">
          {stats.assignedToMe === 0
            ? 'No open tasks are assigned to you right now.'
            : `You have ${stats.assignedToMe} open task${stats.assignedToMe === 1 ? '' : 's'} assigned to you.`}
        </p>
        </div>
      </div>

      <Suspense fallback={<div className="glass-lg report-skeleton" role="status">Loading task report…</div>}>
        <TaskReport3D workspaceId={workspaceId} workspaces={workspaces} onWorkspaceChange={setWorkspaceId} />
      </Suspense>

      {stats.totalProjects === 0 ? (
        <EmptyState
          title="No projects yet"
          message="Create a workspace, then add your first project to see progress here."
          action={<Link to="/workspaces" className="btn-primary">Go to workspaces</Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total projects" value={stats.totalProjects} />
            <StatCard label="Total tasks" value={stats.totalTasks} />
            <StatCard label="To do" value={stats.todo} />
            <StatCard label="In progress" value={stats.inProgress} />
            <StatCard label="Completed" value={stats.done} tone="text-emerald-700" />
            <StatCard label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? 'text-red-600' : 'text-slate-900'} />
          </div>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Task progress</h2>
              <span className="text-sm font-semibold text-slate-600">{stats.completionPercent}% complete</span>
            </div>
            {/* A simple CSS bar: each colored part is as wide as its share of all tasks. */}
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-200">
              {TASK_STATUSES.map((status) => (
                <div
                  key={status}
                  className={STATUS_STYLES[status].bar}
                  style={{ width: `${stats.totalTasks ? (statusCounts[status] / stats.totalTasks) * 100 : 0}%` }}
                  title={`${status}: ${statusCounts[status]}`}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
              {TASK_STATUSES.map((status) => (
                <li key={status} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].bar}`} />
                  {status}: {statusCounts[status]}
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="text-base font-bold text-slate-900">Recently updated projects</h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {recentProjects.map((project) => (
                  <li key={project._id} className="py-3">
                    <Link to={`/projects/${project._id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-700">{project.name}</Link>
                    <p className="mb-2 text-xs text-slate-500">{project.workspace?.name}</p>
                    <ProgressBar percent={project.progress.percent} />
                  </li>
                ))}
              </ul>
            </section>

            <div className="space-y-6">
              <section className="card p-5">
                <h2 className="text-base font-bold text-slate-900">Upcoming deadlines</h2>
                <TaskList tasks={upcomingDeadlines} emptyText="No upcoming deadlines. Add due dates to your tasks." />
              </section>
              {overdueTasks.length > 0 && (
                <section className="card border-red-200 p-5">
                  <h2 className="text-base font-bold text-red-700">Overdue tasks</h2>
                  <TaskList tasks={overdueTasks} emptyText="" />
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
