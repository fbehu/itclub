import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading, setUser } = useAuth();
  const { toast } = useToast();
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = authLoading || localLoading;

  // Check tokens and redirect if already logged in
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (accessToken && refreshToken) {
      // Try to fetch user info
      (async () => {
        try {
          const response = await authFetch(API_ENDPOINTS.USER_ME, { method: 'GET' });
          if (response.ok) {
            const user = await response.json();
            setUser(user);
            if (user.role === 'admin') {
              navigate('/dashboard');
            } else {
              navigate('/dashboard');
            }
          }
        } catch (err) {
          // If error, stay on login page
        }
      })();
    }
  }, [navigate, setUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!usernameOrPhone.trim() || !password.trim()) {
      toast({
        title: 'Xato',
        description: 'Username yoki parol maydonini to\'ldiring',
        variant: 'destructive',
      });
      return;
    }

    setLocalLoading(true);

    try {
      const result = await login(usernameOrPhone, password);
      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Tizimga kirdingiz',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Xato',
          description: result.error || 'Tizimga kirishda xatolik yuz berdi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Tizimga kirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      <div className="login-card">
        <img className="logo-placeholder" src="/logo.png" alt="Logo" />
        
        <div className="login-header">
          <h3>University of Business and Science<br />Tashkent branch</h3>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="usernameOrPhone">Username yoki Telefon</label>
          <input
            type="text"
            id="usernameOrPhone"
            placeholder="username yoki telefon raqam"
            value={usernameOrPhone}
            onChange={(e) => setUsernameOrPhone(e.target.value)}
            required
            disabled={isLoading}
          />

          <label htmlFor="password">Parol</label>
          <input
            type="password"
            id="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <button type="submit" className="signin-btn" disabled={isLoading}>
            {isLoading ? 'Yuklanmoqda...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
