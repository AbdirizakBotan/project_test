import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../utils/axios';
import { AxiosError } from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  is_login?: boolean;
  createdAt?: string;
  last_login?: string;
  last_logout?: string;
  attempt_login_time?: string;
  created_by?: {
    username?: string;
    email?: string;
  };
  photo?: string; 
  photo_id?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (userData: User) => void; 
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/admin/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    checkAuth();
  }, [checkAuth]); 

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/admin/login', { email, password }, {withCredentials: true});
      if (!response.data.user) {
        throw new Error('Invalid response format from server');
      }
      const fullUserRes = await api.get('/api/auth/admin/me');
      setUser(fullUserRes.data.user);
    } catch (error) {
      setUser(null);
      if (error instanceof AxiosError) {
        if (error.response) {
          throw new Error(error.response.data.error || 'An error occurred');
        } else if (error.request) {
          throw new Error('Network error or no response from server');
        }
      }
      throw new Error('Login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/admin/logout');
    } catch {
      console.log('Logout failed');
    }
    setUser(null);
    window.location.href = '/signin';
  };

  const updateUser = useCallback((userData: User) => {
    setUser(userData); 
    checkAuth(); 
  }, [checkAuth]); 

  if (loading) return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated: !!user, updateUser, checkAuth }}> 
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