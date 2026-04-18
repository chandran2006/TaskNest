import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Requires login. If logged in but no org → send to /select-org first.
export function ProtectedRoute() {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user && !user.organization_id) return <Navigate to="/select-org" replace />;
  return <Outlet />;
}

// Requires login + org. Used inside ProtectedRoute so org is guaranteed.
export function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

// Guests only. Logged-in users with no org go to /select-org, others to /dashboard.
export function GuestRoute() {
  const { token, user } = useAuth();
  if (!token) return <Outlet />;
  return <Navigate to={user?.organization_id ? '/dashboard' : '/select-org'} replace />;
}

// Requires a valid token but no org yet (the org-setup step).
export function OrgSetupRoute() {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.organization_id) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
