import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectApi, workspaceApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';
import ProjectCard from '../components/ProjectCard';
import Icon from '../components/Icons';

export default function Projects() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Workspaces are needed for the filter dropdown and for the "New project" form.
  useEffect(() => {
    workspaceApi.list().then((data) => setWorkspaces(data.workspaces)).catch(() => {});
  }, []);

  // Fetch projects whenever the search text or workspace filter changes (with a short delay while typing).
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (workspaceFilter) params.workspace = workspaceFilter;
        const data = await projectApi.list(params);
        if (!ignore) {
          setProjects(data.projects);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setInitialLoading(false);
      }
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, workspaceFilter, reloadKey]);

  async function handleCreate(values) {
    setSubmitting(true);
    setFormError('');
    try {
      const data = await projectApi.create(values);
      showSuccess('Project created.');
      navigate(`/projects/${data.project._id}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  const newProjectButton = workspaces.length > 0 && (
    <button type="button" className="btn-primary" onClick={() => { setFormError(''); setShowForm(true); }}>
      <Icon name="plus" className="h-4 w-4" /> New project
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Every project from the workspaces you belong to.</p>
        </div>
        {newProjectButton}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <div>
          <label htmlFor="project-search" className="label">Search projects</label>
          <input id="project-search" type="search" className="input" placeholder="Search by project name" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label htmlFor="project-workspace-filter" className="label">Workspace</label>
          <select id="project-workspace-filter" className="input" value={workspaceFilter} onChange={(e) => setWorkspaceFilter(e.target.value)}>
            <option value="">All workspaces</option>
            {workspaces.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {initialLoading && <Loading label="Loading projects..." />}
      {error && <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!initialLoading && !error && projects.length === 0 && (
        search || workspaceFilter ? (
          <EmptyState title="No matching projects" message="Try a different search or choose another workspace." />
        ) : workspaces.length === 0 ? (
          <EmptyState
            title="Create a workspace first"
            message="Projects live inside workspaces, so you need at least one."
            action={<Link to="/workspaces" className="btn-primary">Go to workspaces</Link>}
          />
        ) : (
          <EmptyState title="No projects yet" message="Create your first project to start planning tasks." action={newProjectButton} />
        )
      )}

      {!initialLoading && !error && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
        </div>
      )}

      {showForm && (
        <Modal title="New project" onClose={() => setShowForm(false)}>
          <ProjectForm workspaces={workspaces} onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitting={submitting} error={formError} />
        </Modal>
      )}
    </div>
  );
}
