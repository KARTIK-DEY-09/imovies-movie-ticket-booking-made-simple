import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  avatar?: string;
  watchlist: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { username?: string; phone?: string; avatar?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  watchlist: string[];
  toggleWatchlist: (movieId: string) => Promise<boolean>;
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('imovies_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch current user if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest<{ user: User }>('/auth/me');
        setUser(data.user);
        setWatchlist(data.user.watchlist || []);
        await fetchNotifications();
      } catch (err) {
        console.error('Session expired or invalid token:', err);
        localStorage.removeItem('imovies_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest<{ notifications: Notification[] }>('/notifications');
      setNotifications(data.notifications || []);
    } catch {
      // ignore
    }
  };

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('imovies_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setWatchlist(data.user.watchlist || []);
    await fetchNotifications();
  };

  const register = async (username: string, email: string, password: string, phone?: string) => {
    const data = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, phone }),
    });
    localStorage.setItem('imovies_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setWatchlist([]);
  };

  const logout = () => {
    localStorage.removeItem('imovies_token');
    setToken(null);
    setUser(null);
    setWatchlist([]);
    setNotifications([]);
  };

  const updateProfile = async (data: { username?: string; phone?: string; avatar?: string }) => {
    const res = await apiRequest<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setUser(res.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  };

  const toggleWatchlist = async (movieId: string): Promise<boolean> => {
    if (!user) return false;
    const isCurrentlyIn = watchlist.includes(movieId);
    if (isCurrentlyIn) {
      await apiRequest(`/users/watchlist/${movieId}`, { method: 'DELETE' });
      setWatchlist(prev => prev.filter(id => id !== movieId));
      return false;
    } else {
      await apiRequest(`/users/watchlist/${movieId}`, { method: 'POST' });
      setWatchlist(prev => [...prev, movieId]);
      return true;
    }
  };

  const markNotificationRead = async (id: string) => {
    await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        watchlist,
        toggleWatchlist,
        notifications,
        unreadCount,
        markNotificationRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
