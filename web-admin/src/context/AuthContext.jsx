import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getApiBase, loginAdmin, logoutAdmin, meAdmin, setApiBase } from '../lib/api';

const AuthContext = createContext(null);

const STORAGE = {
  token: 'property-admin-token',
  profile: 'property-admin-profile'
};

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.profile) || 'null');
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [apiBase, setApiBaseState] = useState(getApiBase());
  const [token, setToken] = useState(localStorage.getItem(STORAGE.token) || '');
  const [profile, setProfile] = useState(readProfile());
  const [error, setError] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      const savedApiBase = getApiBase();
      setApiBaseState(savedApiBase);
      if (!token) {
        setStatus('anonymous');
        return;
      }
      try {
        const me = await meAdmin(savedApiBase, token);
        setProfile(me);
        setStatus('authenticated');
      } catch (err) {
        localStorage.removeItem(STORAGE.token);
        localStorage.removeItem(STORAGE.profile);
        setToken('');
        setProfile(null);
        setStatus('anonymous');
      }
    };
    bootstrap();
  }, []);

  const login = async ({ baseUrl, adminKey }) => {
    setError('');
    const nextBase = setApiBase(baseUrl);
    setApiBaseState(nextBase);
    const data = await loginAdmin(nextBase, adminKey);
    localStorage.setItem(STORAGE.token, data.token);
    localStorage.setItem(STORAGE.profile, JSON.stringify(data));
    setToken(data.token);
    setProfile(data);
    setStatus('authenticated');
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutAdmin(apiBase, token);
      }
    } catch (err) {
      // ignore logout errors
    } finally {
      localStorage.removeItem(STORAGE.token);
      localStorage.removeItem(STORAGE.profile);
      setToken('');
      setProfile(null);
      setStatus('anonymous');
    }
  };

  const value = useMemo(() => ({
    apiBase,
    token,
    profile,
    status,
    error,
    setError,
    setApiBaseState,
    login,
    logout
  }), [apiBase, token, profile, status, error, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
