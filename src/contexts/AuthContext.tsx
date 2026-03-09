import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'SUPER_ADMIN' | 'PRESIDENT' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'PARTICIPANT';

interface UserRole {
  role_id: string;
  roles: {
    name: AppRole;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isReady: boolean;
  roles: AppRole[];
  signUp: (email: string, password: string, fullName?: string, college?: string, course?: string, rollNo?: string, admissionYear?: number, idCardUrl?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  hasRole: (role: AppRole) => boolean;
  hasMinRoleLevel: (minLevel: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_LEVELS: Record<AppRole, number> = {
  SUPER_ADMIN: 5,
  PRESIDENT: 4,
  TEAM_LEAD: 3,
  TEAM_MEMBER: 2,
  PARTICIPANT: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return (data as unknown as UserRole[])?.map((ur) => ur.roles.name) || [];
  };

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userRoles = await fetchUserRoles(session.user.id);
        setRoles(userRoles);
      }

      setLoading(false);
    });

    // Listen for auth changes after initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userRoles = await fetchUserRoles(session.user.id);
          setRoles(userRoles);
        } else {
          setRoles([]);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, college?: string, course?: string, rollNo?: string, admissionYear?: number, idCardUrl?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          college,
          course,
          roll_no: rollNo,
          admission_year: admissionYear,
          id_card_url: idCardUrl,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const hasMinRoleLevel = (minLevel: number) => {
    // All authenticated users are at least PARTICIPANT (level 1)
    const baseLevel = user ? 1 : 0;
    const maxUserLevel = Math.max(...roles.map((r) => ROLE_LEVELS[r] || 0), baseLevel);
    return maxUserLevel >= minLevel;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        hasRole,
        hasMinRoleLevel,
      }}
    >
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
