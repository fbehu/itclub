import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'student' | 'admin';
  surname: string;
  lastname: string;
  phone_number: string;
  tg_username?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  course?: string;
  direction?: string;
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users
const defaultUsers: Record<string, { password: string; user: User }> = {
  student: {
    password: 'student123',
    user: {
      id: 'e4c9b8f1-5a2d-4e3c-9b1f-6d8a7c5e4b3a',
      username: 'student',
      password: 'student123',
      role: 'student',
      surname: 'Karimov',
      lastname: 'Aziz',
      phone_number: '+998901234567',
      tg_username: 'aziz_karimov',
      level: 'intermediate',
      course: 'Kurs 2',
      direction: 'Dasturiy injinering',
    },
  },
  admin: {
    password: 'admin123',
    user: {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      surname: 'Admin',
      lastname: 'User',
      phone_number: '+998901234568',
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const userData = defaultUsers[username];
    if (userData && userData.password === password) {
      setUser(userData.user);
      localStorage.setItem('currentUser', JSON.stringify(userData.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
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
