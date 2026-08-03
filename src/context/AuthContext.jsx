import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
        } catch (err) {
          console.error("Token expirado o inválido:", err);
          localStorage.removeItem('jwt_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('jwt_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    localStorage.setItem('jwt_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const forgotPassword = async (email) => {
    return await api.forgotPassword(email);
  };

  const updateUserProfile = (updatedUser, token) => {
    if (token) {
      localStorage.setItem('jwt_token', token);
    }
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, forgotPassword, updateUserProfile, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
