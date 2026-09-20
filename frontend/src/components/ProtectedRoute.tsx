import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const token = sessionStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;