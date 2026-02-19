import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { UserRole } from '@/types';

export type { UserRole };

export interface AuthProfile {
  id: number;
  role?: UserRole;
  [key: string]: unknown;
}

type AuthContextValue = {
  profile: AuthProfile | null;
  setProfile: (profile: AuthProfile | null) => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const value = useMemo(
    () => ({
      profile,
      setProfile,
      isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
    }),
    [profile]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function useAuthOptional() {
  return useContext(AuthContext);
}
