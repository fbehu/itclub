import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemStatus } from '@/contexts/SystemStatusContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isMaintenanceActive } = useSystemStatus();
  
  if (isMaintenanceActive) {
    return <Navigate to="/login" />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}
