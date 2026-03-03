import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemStatus } from '@/contexts/SystemStatusContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Optional: restrict to specific roles
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const { isMaintenanceActive } = useSystemStatus();
  
  if (isMaintenanceActive) {
    return <Navigate to="/login" />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has allowed role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/dashboard/admin" />;
    // } else if (user.role === 'manager') {
    //   return <Navigate to="/dashboard/" />;
    } else if (user.role === 'teacher') {
      return <Navigate to="/dashboard/teacher" />;
    } else if (user.role === 'sub_teacher') {
      return <Navigate to="/dashboard/teacher" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return <>{children}</>;
}
