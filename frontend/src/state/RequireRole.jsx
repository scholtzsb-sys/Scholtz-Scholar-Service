import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from './AppContext';

export default function RequireRole({ role }) {
  const { state } = useApp();
  // Still restoring a stored token — don't redirect yet, or a real session
  // gets bounced to "/" for one render before it resolves.
  if (state.authLoading) return null;
  if (!state.session || state.session.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
