'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiLogin, apiMe } from './api';
import type { UserOut, LoginRequest } from './api';

interface AuthState {
  user: UserOut | null;
  loading: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (creds: LoginRequest) => {
    const { access_token } = await apiLogin(creds);
    localStorage.setItem('token', access_token);
    const me = await apiMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
