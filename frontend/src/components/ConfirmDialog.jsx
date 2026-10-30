import Modal from './Modal';

// "Are you sure?" dialog used before every destructive action.
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading = false }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className="btn-danger" disabled={loading}>
          {loading ? 'Please wait...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
