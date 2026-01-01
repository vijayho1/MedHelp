import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/integrations/firebase/client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName ?? fbUser.email ?? 'User',
          email: fbUser.email ?? '',
          avatar: fbUser.photoURL ?? undefined,
        });
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    setUser({
      id: fbUser.uid,
      name: fbUser.displayName ?? fbUser.email ?? 'User',
      email: fbUser.email ?? '',
      avatar: fbUser.photoURL ?? undefined,
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
