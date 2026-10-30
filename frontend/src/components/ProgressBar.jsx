export default function ProgressBar({ percent = 0, showLabel = true }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
      {showLabel && <span className="w-10 text-right text-xs font-semibold text-slate-600">{percent}%</span>}
    </div>
  );
}
