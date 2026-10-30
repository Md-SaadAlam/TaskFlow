import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

// Wraps pages that need a login. Visitors who are not logged in are sent to /login.
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

// Wraps the login/register pages. Logged-in users are sent to the dashboard instead.
export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Loading label="Checking your session..." />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
