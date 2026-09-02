import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cachedUser = localStorage.getItem('stockflow_user');
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('stockflow_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stockflow_token');
      if (storedToken) {
        try {
          const res = await api.get<{ data: { user: User } }>('/auth/me');
          setUser(res.data.data.user);
          localStorage.setItem('stockflow_user', JSON.stringify(res.data.data.user));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('stockflow_token');
          localStorage.removeItem('stockflow_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ data: { user: User; token: string } }>('/auth/login', {
      email,
      password,
    });

    const { user: loggedInUser, token: authToken } = res.data.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('stockflow_token', authToken);
    localStorage.setItem('stockflow_user', JSON.stringify(loggedInUser));
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post<{ data: { user: User; token: string } }>('/auth/register', {
      name,
      email,
      password,
    });

    const { user: registeredUser, token: authToken } = res.data.data;
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem('stockflow_token', authToken);
    localStorage.setItem('stockflow_user', JSON.stringify(registeredUser));
  };

  const logout = () => {
    // Attempt graceful backend notification
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
