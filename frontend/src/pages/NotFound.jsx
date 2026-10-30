import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-5xl font-extrabold text-brand-700">404</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">This page does not exist</h1>
      <p className="mt-1 text-sm text-slate-500">The link may be broken, or the page may have been moved.</p>
      <Link to="/" className="btn-primary mt-6">Go to the dashboard</Link>
    </div>
  );
}
