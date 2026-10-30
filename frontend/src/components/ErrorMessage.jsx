// Shows an error. If onRetry is given, a "Try again" button is shown.
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary btn-sm mt-3">
          Try again
        </button>
      )}
    </div>
  );
}
