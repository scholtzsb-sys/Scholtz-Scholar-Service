import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from './AppContext';

export default function RequireRole({ role }) {
  const { state } = useApp();
  if (!state.session || state.session.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
