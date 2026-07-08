import { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('stadium_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(true);

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('stadium_token', data.token);
    localStorage.setItem('stadium_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await client.post('/auth/register', payload);
    localStorage.setItem('stadium_token', data.token);
    localStorage.setItem('stadium_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('stadium_token');
    localStorage.removeItem('stadium_user');
    setUser(null);
  }, []);

  const updateStoredUser = useCallback((next) => {
    localStorage.setItem('stadium_user', JSON.stringify(next));
    setUser(next);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, updateStoredUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export const ROLE_LABELS = {
  fan: 'Fan',
  box_office_staff: 'Box Office Staff',
  gate_scanner_officer: 'Gate Scanner Officer',
  stadium_admin: 'Stadium Administrator',
  sport_commission_officer: 'Sport Commission Officer'
};

export const ROLE_HOME = {
  fan: '/events',
  box_office_staff: '/box-office',
  gate_scanner_officer: '/gate',
  stadium_admin: '/admin',
  sport_commission_officer: '/admin/reports'
};
