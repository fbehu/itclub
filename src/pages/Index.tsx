import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're exactly on /dashboard
    if (user && location.pathname === '/dashboard') {
      if (user.role === 'admin') {
        navigate('/dashboard/admin/users', { replace: true });
      } else {
        navigate('/dashboard/profile', { replace: true });
      }
    }
  }, [user, navigate, location.pathname]);

  return null;
};

export default Index;
