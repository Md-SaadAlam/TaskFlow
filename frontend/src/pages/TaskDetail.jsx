import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { activityApi, taskApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TaskForm from '../components/TaskForm';
import ActivityList from '../components/ActivityList';
import Avatar from '../components/Avatar';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { TASK_STATUSES } from '../utils/constants';
import { formatDate, formatDateTime, isOverdue } from '../utils/format';

export default function TaskDetail() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState(null); // { task, members, myRole, canDelete }
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [taskData, commentData, activityData] = await Promise.all([
        taskApi.get(taskId),
        taskApi.comments(taskId),
        activityApi.list({ task: taskId, limit: 20 }),
      ]);
      setData(taskData);
      setComments(commentData.comments);
      setActivity(activityData.activity);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading label="Loading task..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const { task, members, myRole, canDelete } = data;
  const isAdmin = myRole === 'owner' || myRole === 'admin';

  async function handleEdit(values) {
    setBusy(true);
    setFormError('');
    try {
      await taskApi.update(taskId, values);
      showSuccess('Task updated.');
      setShowEdit(false);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(event) {
    try {
      await taskApi.updateStatus(taskId, event.target.value);
      showSuccess('Status updated.');
      load();
    } catch (err) {
      showError(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await taskApi.remove(taskId);
      showSuccess('Task deleted.');
      navigate(`/projects/${task.project._id}`);
    } catch (err) {
      setConfirmDelete(false);
      setBusy(false);
      showError(getErrorMessage(err));
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();
    if (!commentText.trim()) {
      setCommentError('Write a comment first.');
      return;
    }
    setCommentError('');
    setPosting(true);
    try {
      const result = await taskApi.addComment(taskId, commentText.trim());
      setComments([...comments, result.comment]);
      setCommentText('');
      const activityData = await activityApi.list({ task: taskId, limit: 20 });
      setActivity(activityData.activity);
    } catch (err) {
      setCommentError(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await taskApi.deleteComment(taskId, commentId);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (err) {
      showError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/projects/${task.project._id}`} className="text-sm font-medium text-brand-700 hover:underline">
          {task.project.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="page-title max-w-2xl">{task.title}</h1>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => { setFormError(''); setShowEdit(true); }}>Edit</button>
            {canDelete && <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-base font-bold text-slate-900">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{task.description || 'No description.'}</p>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold text-slate-900">Comments ({comments.length})</h2>
            {comments.length === 0 && <p className="mt-2 text-sm text-slate-500">No comments yet. Start the conversation below.</p>}
            <ul className="mt-3 space-y-4">
              {comments.map((comment) => (
                <li key={comment._id} className="flex gap-3">
                  <Avatar name={comment.author?.name} size="h-8 w-8 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-slate-900">{comment.author?.name || 'Unknown user'}</span>
                      <span className="ml-2 text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.text}</p>
                    {(comment.author?._id === user._id || isAdmin) && (
                      <button type="button" onClick={() => handleDeleteComment(comment._id)} className="mt-1 text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddComment} className="mt-5 space-y-2">
              <label htmlFor="comment" className="label">Add a comment</label>
              <textarea id="comment" rows={3} className="input" maxLength={1000} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
              {commentError && <p className="text-sm text-red-600" role="alert">{commentError}</p>}
              <button type="submit" className="btn-primary" disabled={posting}>{posting ? 'Posting...' : 'Post comment'}</button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-4 p-5 text-sm">
            <div>
              <label htmlFor="status" className="label">Status</label>
              <select id="status" className="input" value={task.status} onChange={handleStatusChange}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Priority</span>
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Current status</span>
              <StatusBadge status={task.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assigned to</span>
              {task.assignee ? (
                <span className="flex items-center gap-2 font-medium"><Avatar name={task.assignee.name} />{task.assignee.name}</span>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Due date</span>
              <span className={isOverdue(task) ? 'font-semibold text-red-600' : 'font-medium'}>
                {task.dueDate ? formatDate(task.dueDate) : 'No date'}{isOverdue(task) && ' (overdue)'}
              </span>
            </div>
            <hr className="border-slate-200" />
            <p className="text-xs text-slate-500">Created by {task.createdBy?.name} on {formatDateTime(task.createdAt)}</p>
            <p className="text-xs text-slate-500">
              Last updated {formatDateTime(task.updatedAt)}{task.updatedBy ? ` by ${task.updatedBy.name}` : ''}
            </p>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-base font-bold text-slate-900">Activity</h2>
            <ActivityList activity={activity} />
          </section>
        </aside>
      </div>

      {showEdit && (
        <Modal title="Edit task" onClose={() => setShowEdit(false)} wide>
          <TaskForm task={task} members={members} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} submitting={busy} error={formError} />
        </Modal>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message="The task and all of its comments will be permanently deleted."
          confirmLabel="Delete task"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={busy}
        />
      )}
    </div>
  );
}
