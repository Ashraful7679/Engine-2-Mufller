
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (userId: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Fetch users from Supabase
  const fetchUsers = async () => {
    // If DB is not configured, use mock data immediately
    if (!isSupabaseConfigured) {
      setAllUsers(MOCK_USERS);
      return;
    }

    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAllUsers(data as User[]);
      } else {
        // Seed users if empty
        console.log("Seeding Users...");
        const { error: insertError } = await supabase.from('users').insert(MOCK_USERS);
        if (!insertError) setAllUsers(MOCK_USERS);
        else console.error("User Seed Error:", insertError);
      }
    } catch (err) {
      console.error("Error loading users:", JSON.stringify(err));
      // Fallback to mock if DB fails
      setAllUsers(MOCK_USERS);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('autotrack_user_session');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    }
  }, []);

  // Ensure session user stays synced with DB updates
  useEffect(() => {
    if (user && allUsers.length > 0) {
      const freshData = allUsers.find(u => u.id === user.id);
      if (freshData) setUser(freshData);
    }
  }, [allUsers]);

  const login = async (userId: string, password?: string): Promise<boolean> => {
    const foundUser = allUsers.find(u => u.id === userId);
    if (foundUser) {
      if (foundUser.password && foundUser.password !== password) {
        return false;
      }
      setUser(foundUser);
      localStorage.setItem('autotrack_user_session', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autotrack_user_session');
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    // Optimistic update
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    
    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').update(data).eq('id', userId);
      } catch (err) {
        console.error("Failed to update user in DB", err);
        fetchUsers(); // Revert on error
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, allUsers, login, logout, updateUser, isAuthenticated: !!user }}>
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
