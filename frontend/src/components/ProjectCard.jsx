import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { formatDate } from '../utils/format';

export default function ProjectCard({ project }) {
  const { progress } = project;
  return (
    <Link to={`/projects/${project._id}`} className="card block p-5 transition-colors hover:border-brand-500">
      <p className="text-xs font-medium text-slate-500">{project.workspace?.name}</p>
      <h3 className="mt-1 text-base font-bold text-slate-900">{project.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600">{project.description || 'No description yet.'}</p>
      <div className="mt-4"><ProgressBar percent={progress.percent} /></div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{progress.done} of {progress.total} tasks done</span>
        <span>{project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'No due date'}</span>
      </div>
    </Link>
  );
}
