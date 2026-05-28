'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getUserProfile, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();

// Demo profile for when Supabase is not configured
const DEMO_PROFILE = {
  id: 'demo-user',
  name: 'Demo Admin',
  email: 'admin@upgrad.com',
  role: 'admin',
  active: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const fetchProfile = useCallback(async (userId, authUser) => {
    try {
      const { data } = await getUserProfile(userId);
      if (data && data.active === false) {
        // Kick deactivated user out immediately!
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
      } else {
        const dbAvatar = authUser?.user_metadata?.avatar_url;
        const localAvatar = typeof window !== 'undefined' ? localStorage.getItem(`upgrad_avatar_${data.email}`) : null;
        setProfile({
          ...data,
          avatar_url: dbAvatar || localAvatar || data.avatar_url
        });
      }
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // If Supabase is not configured, use demo mode
    if (!isSupabaseConfigured()) {
      const localAvatar = typeof window !== 'undefined' ? localStorage.getItem('upgrad_avatar_admin@upgrad.com') : null;
      setUser({ id: 'demo-user', email: 'admin@upgrad.com' });
      setProfile({
        ...DEMO_PROFILE,
        avatar_url: localAvatar
      });
      setSession({ user: { id: 'demo-user', email: 'admin@upgrad.com' } });
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id, s.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id, s.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    if (isSupabaseConfigured()) {
      const { data: { user: latestUser } } = await supabase.auth.getUser();
      if (latestUser) {
        setUser(latestUser);
        await fetchProfile(latestUser.id, latestUser);
      }
    } else {
      const localAvatar = typeof window !== 'undefined' ? localStorage.getItem(`upgrad_avatar_${user.email}`) : null;
      setProfile(prev => ({
        ...prev,
        avatar_url: localAvatar
      }));
    }
  }, [user, fetchProfile]);

  const value = {
    user,
    profile,
    session,
    loading,
    isDemo: !isSupabaseConfigured(),
    isAdmin: profile?.role === 'admin',
    isCoAdmin: profile?.role === 'co_admin',
    isUser: profile?.role === 'user',
    hasAdminAccess: profile?.role === 'admin' || profile?.role === 'co_admin',
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
