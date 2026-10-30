import { PRIORITY_STYLES, STATUS_STYLES } from '../utils/constants';

const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold';

export function PriorityBadge({ priority }) {
  return <span className={`${base} ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low}`}>{priority}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`${base} ${STATUS_STYLES[status]?.badge || ''}`}>{status}</span>;
}

const ROLE_STYLES = {
  owner: 'bg-brand-100 text-brand-800',
  admin: 'bg-violet-100 text-violet-800',
  member: 'bg-slate-100 text-slate-700',
};

export function RoleBadge({ role }) {
  return <span className={`${base} capitalize ${ROLE_STYLES[role] || ROLE_STYLES.member}`}>{role}</span>;
}
