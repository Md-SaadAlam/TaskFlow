import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectApi, workspaceApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProjectForm from '../components/ProjectForm';
import ProjectCard from '../components/ProjectCard';
import Avatar from '../components/Avatar';
import Icon from '../components/Icons';
import { RoleBadge } from '../components/Badges';

export default function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState(null); // { workspace, members, myRole }
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null); // 'edit' | 'project' | null
  const [confirm, setConfirm] = useState(null); // { type: 'delete' | 'remove', member? }
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [workspaceData, projectData] = await Promise.all([
        workspaceApi.get(workspaceId),
        projectApi.list({ workspace: workspaceId }),
      ]);
      setData(workspaceData);
      setProjects(projectData.projects);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading label="Loading workspace..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const { workspace, members, myRole } = data;
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  function openEdit() {
    setEditForm({ name: workspace.name, description: workspace.description || '' });
    setFormError('');
    setModal('edit');
  }

  async function handleEdit(event) {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await workspaceApi.update(workspaceId, { name: editForm.name.trim(), description: editForm.description.trim() });
      showSuccess('Workspace updated.');
      setModal(null);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateProject(values) {
    setBusy(true);
    setFormError('');
    try {
      const result = await projectApi.create({ ...values, workspace: workspaceId });
      showSuccess('Project created.');
      navigate(`/projects/${result.project._id}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
      setBusy(false);
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await workspaceApi.addMember(workspaceId, { email: memberForm.email.trim(), role: memberForm.role });
      setData({ ...data, members: result.members });
      setMemberForm({ email: '', role: 'member' });
      showSuccess('Member added.');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(member, role) {
    try {
      const result = await workspaceApi.updateMemberRole(workspaceId, member._id, role);
      setData({ ...data, members: result.members });
      showSuccess(`${member.name} is now ${role === 'admin' ? 'an admin' : 'a member'}.`);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      if (confirm.type === 'delete') {
        await workspaceApi.remove(workspaceId);
        showSuccess('Workspace deleted.');
        navigate('/workspaces');
        return;
      }
      await workspaceApi.removeMember(workspaceId, confirm.member._id);
      if (confirm.member._id === user._id) {
        showSuccess('You left the workspace.');
        navigate('/workspaces');
        return;
      }
      setData({ ...data, members: members.filter((m) => m._id !== confirm.member._id) });
      showSuccess('Member removed.');
      setConfirm(null);
    } catch (err) {
      showError(getErrorMessage(err));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  // Owners can remove anyone except themselves; admins can remove plain members; anyone can leave.
  function canRemove(member) {
    if (member.role === 'owner') return false;
    if (member._id === user._id) return true;
    return isAdmin && (member.role !== 'admin' || isOwner);
  }

  const newProjectButton = (
    <button type="button" className="btn-primary" onClick={() => { setFormError(''); setModal('project'); }}>
      <Icon name="plus" className="h-4 w-4" /> New project
    </button>
  );

  return (
    <div className="space-y-8">
      <div>
        <Link to="/workspaces" className="text-sm font-medium text-brand-700 hover:underline">All workspaces</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{workspace.name}</h1>
              <RoleBadge role={myRole} />
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{workspace.description || 'No description.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && <button type="button" className="btn-secondary" onClick={openEdit}>Edit</button>}
            {!isOwner && (
              <button type="button" className="btn-secondary" onClick={() => setConfirm({ type: 'remove', member: members.find((m) => m._id === user._id) })}>
                Leave
              </button>
            )}
            {isOwner && <button type="button" className="btn-danger" onClick={() => setConfirm({ type: 'delete' })}>Delete workspace</button>}
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Projects</h2>
          {projects.length > 0 && newProjectButton}
        </div>
        {projects.length === 0 ? (
          <EmptyState title="No projects in this workspace" message="Create a project to start adding tasks." action={newProjectButton} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Members ({members.length})</h2>
        <div className="card divide-y divide-slate-100">
          {members.map((member) => (
            <div key={member._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={member.name} size="h-9 w-9 text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {member.name} {member._id === user._id && <span className="font-normal text-slate-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value)}
                    aria-label={`Role of ${member.name}`}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <RoleBadge role={member.role} />
                )}
                {canRemove(member) && (
                  <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => setConfirm({ type: 'remove', member })}>
                    {member._id === user._id ? 'Leave' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isAdmin && (
          <form onSubmit={handleAddMember} className="card mt-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <label htmlFor="member-email" className="label">Add a teammate by email</label>
              <input id="member-email" type="email" className="input" placeholder="name@example.com" required value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
              <p className="mt-1 text-xs text-slate-500">They must already have a TaskFlow account.</p>
            </div>
            <div>
              <label htmlFor="member-role" className="label">Role</label>
              <select id="member-role" className="input" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>
                <option value="member">Member</option>
                {isOwner && <option value="admin">Admin</option>}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>Add member</button>
          </form>
        )}
      </section>

      {modal === 'edit' && (
        <Modal title="Edit workspace" onClose={() => setModal(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{formError}</p>}
            <div>
              <label htmlFor="edit-ws-name" className="label">Name</label>
              <input id="edit-ws-name" className="input" value={editForm.name} maxLength={60} required onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="edit-ws-description" className="label">Description</label>
              <textarea id="edit-ws-description" rows={3} className="input" value={editForm.description} maxLength={300} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'project' && (
        <Modal title="New project" onClose={() => setModal(null)}>
          <ProjectForm onSubmit={handleCreateProject} onCancel={() => setModal(null)} submitting={busy} error={formError} />
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.type === 'delete' ? 'Delete this workspace?' : confirm.member._id === user._id ? 'Leave this workspace?' : 'Remove this member?'}
          message={
            confirm.type === 'delete'
              ? 'This permanently deletes the workspace together with all of its projects, tasks and comments. This cannot be undone.'
              : confirm.member._id === user._id
                ? 'You will lose access to this workspace and its projects.'
                : `${confirm.member.name} will lose access, and their tasks will become unassigned.`
          }
          confirmLabel={confirm.type === 'delete' ? 'Delete workspace' : confirm.member._id === user._id ? 'Leave' : 'Remove'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          loading={busy}
        />
      )}
    </div>
  );
}
