import { formatDateTime } from '../utils/format';

// Shows activity records such as: "Priya moved "Fix login" from To Do to In Progress".
export default function ActivityList({ activity }) {
  if (activity.length === 0) return <p className="text-sm text-slate-500">No activity yet.</p>;
  return (
    <ul className="space-y-3">
      {activity.map((item) => (
        <li key={item._id} className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{item.user?.name || 'Someone'}</span> {item.message}
          <span className="block text-xs text-slate-400">{formatDateTime(item.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
