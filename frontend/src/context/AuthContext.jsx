import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('plantcare_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await api.getProfile();
        setUser(profile);
      } catch (err) {
        console.error('Session expired or invalid:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    const res = await api.login({ username_or_email: usernameOrEmail, password });
    localStorage.setItem('plantcare_token', res.access_token);
    setToken(res.access_token);
    const profile = await api.getProfile();
    setUser(profile);
    return profile;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('plantcare_token', res.access_token);
    setToken(res.access_token);
    const profile = await api.getProfile();
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem('plantcare_token');
    setToken(null);
    setUser(null);
  };

  const updateUserPreferences = async (newPrefs) => {
    try {
      const updated = await api.updatePreferences(newPrefs);
      setUser(prev => prev ? { ...prev, preference: updated } : null);
      return updated;
    } catch (err) {
      console.error('Failed to update preferences:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
