import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authFetch, logoutUser } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'student' | 'admin' | 'teacher' | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  parent_phone_number?: {father?: string, mother?: string} | string | null;
  tg_username?: string;
  level?: string | null;
  social?: string | null;
  invite_code?: string | null;
  group?: { id: string; name: string } | string;
  teaching_groups?: Array<{ id: number; name: string }>;
  student_groups?: Array<{ id: number; name: string }>;
  photo?: string | null;
  coins?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  unread_message_count?: number;
}

interface LoginError {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  setUser: (user: User | null) => void;
  login: (usernameOrPhone: string, password: string) => Promise<{ success: boolean; error?: string; status?: string; data?: any }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current user info using stored tokens
  const fetchCurrentUser = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.USER_ME, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        // If unauthorized or server error, clear localStorage and reset user
        if ([400, 401, 500].includes(response.status)) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('currentUser');
          setUser(null);
        }
        return;
      }

      const data = await response.json();
      const userData: User = {
        id: data.id || '',
        username: data.username || '',
        role: data.role || 'student',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        email: data.email,
        parent_phone_number: data.parent_phone_number,
        tg_username: data.tg_username,
        level: data.level,
        group: data.group,
        teaching_groups: data.teaching_groups,
        student_groups: data.student_groups,
        photo: data.photo,
        social: data.social,
        invite_code: data.invite_code,
        coins: data.coins,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        unread_message_count: data.unread_message_count,
      };
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (error) {
      // On error, clear localStorage and reset user
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('currentUser');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUsers = localStorage.getItem('allUsers');
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (error) {
        console.error('Failed to parse users:', error);
      }
    }
    // Try to fetch current user if token exists
    fetchCurrentUser();
  }, []);

  const login = async (usernameOrPhone: string, password: string): Promise<{ success: boolean; error?: string; status?: string; data?: any }> => {
    setIsLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          username_or_phone: usernameOrPhone,
          password: password,
        }),
      });

      if (!response.ok) {
        // Agar response maintenance statusida javob qaytarsa
        const errorData: any = await response.json();
        
        if (errorData.status === 'maintenance' || errorData.status === 'degraded') {
          return { 
            success: false, 
            error: errorData.message || 'Tizim ta\'mirlash jarayonida',
            status: errorData.status,
            data: {
              status: errorData.status,
              status_display: errorData.status === 'maintenance' ? 'Ta\'mirlash Jarayonida' : 'Kesilgan Xizmatlar',
              message: errorData.message || 'Sayt hozir ishlamayapti',
              updated_at: errorData.updated_at || new Date().toISOString(),
            }
          };
        }
        
        let errorMessage = 'Tizimga kirishda xatolik yuz berdi';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        } else if (Object.keys(errorData).length > 0) {
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
        console.error('Login failed:', errorData);
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      const userData: User = {
        id: data.user.id || '',
        username: data.user.username || usernameOrPhone,
        role: data.user.role || 'student',
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        phone_number: data.user.phone_number || '',
        email: data.user.email,
        parent_phone_number: data.user.parent_phone_number,
        tg_username: data.user.tg_username,
        level: data.user.level,
        group: data.user.group,
        teaching_groups: data.user.teaching_groups,
        student_groups: data.user.student_groups,
        photo: data.user.photo,
        social: data.user.social,
        invite_code: data.user.invite_code,
        coins: data.user.coins,
        is_active: data.user.is_active,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at,
        unread_message_count: data.user.unread_message_count,
      };
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Tizimga kirishda xatolik yuz berdi'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setUsers([]);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setUsers([]);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update in users list
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    }
  };

  const addUser = (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
  };

  const updateUser = (id: string, data: Partial<User>) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...data } : u);
    setUsers(updatedUsers);
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    
    // If updating current user
    if (user?.id === id) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
  };

  return (
    <AuthContext.Provider value={{ user, users, setUser, login, logout, updateProfile, addUser, updateUser, deleteUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
