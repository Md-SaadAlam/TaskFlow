import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workspaceApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import Icon from '../components/Icons';
import { RoleBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

export default function Workspaces() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await workspaceApi.list();
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const data = await workspaceApi.create({ name: form.name.trim(), description: form.description.trim() });
      showSuccess('Workspace created.');
      navigate(`/workspaces/${data.workspace._id}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const newWorkspaceButton = (
    <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
      <Icon name="plus" className="h-4 w-4" /> New workspace
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-500">A workspace is a shared space for a team and its projects.</p>
        </div>
        {user.accountType === 'company' && workspaces.length > 0 && newWorkspaceButton}
      </div>

      {loading && <Loading label="Loading workspaces..." />}
      {error && <ErrorMessage message={error} onRetry={load} />}

      {!loading && !error && workspaces.length === 0 && (
        <EmptyState
          title={user.accountType === 'company' ? 'Your team starts here' : 'Waiting on your team'}
          message={user.accountType === 'company' ? 'Create a workspace for your company, then invite people by their work email.' : 'Ask your company admin to add your work email to a workspace. It will appear here when you are invited.'}
          action={user.accountType === 'company' ? newWorkspaceButton : null}
        />
      )}

      {!loading && !error && workspaces.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link key={workspace._id} to={`/workspaces/${workspace._id}`} className="card block p-5 transition-colors hover:border-brand-500">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">{workspace.name}</h2>
                <RoleBadge role={workspace.myRole} />
              </div>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600">{workspace.description || 'No description.'}</p>
              <p className="mt-4 text-xs text-slate-500">
                {workspace.projectCount} project{workspace.projectCount === 1 ? '' : 's'} &middot; {workspace.memberCount} member{workspace.memberCount === 1 ? '' : 's'}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="New workspace" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{formError}</p>}
            <div>
              <label htmlFor="ws-name" className="label">Name</label>
              <input id="ws-name" className="input" value={form.name} maxLength={60} required autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="ws-description" className="label">Description (optional)</label>
              <textarea id="ws-description" rows={3} className="input" value={form.description} maxLength={300} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create workspace'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
