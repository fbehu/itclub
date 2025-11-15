import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'student' | 'admin';
  firstName: string;
  lastName: string;
  phone: string;
  course: string;
  direction: string;
  telegram?: string;
  image?: string;
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
      id: 'STU001',
      username: 'student',
      role: 'student',
      firstName: 'Aziz',
      lastName: 'Karimov',
      phone: '+998901234567',
      course: '2-kurs',
      direction: 'Dasturiy injinering',
    },
  },
  admin: {
    password: 'admin123',
    user: {
      id: 'ADM001',
      username: 'admin',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+998901234568',
      course: '',
      direction: '',
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
