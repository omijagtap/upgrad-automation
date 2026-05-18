'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { updateProfile } from '@/lib/supabase';

export function useRecents() {
  const { user, profile, refreshProfile } = useAuth();
  const [recent, setRecent] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Helper to filter out expired recent items (older than 24 hours)
  const filterExpiredRecents = useCallback((recentsList) => {
    if (!Array.isArray(recentsList)) return [];
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return recentsList.filter((item) => {
      if (!item || !item.timestamp) return false;
      const timestamp = new Date(item.timestamp).getTime();
      return now - timestamp < twentyFourHours;
    });
  }, []);

  // Load initial recents (prioritize profile.recents, fallback to localStorage)
  useEffect(() => {
    setMounted(true);
    
    let loadedRecents = [];
    
    // 1. Try to load from Supabase user profile
    if (profile && Array.isArray(profile.recents)) {
      loadedRecents = profile.recents;
    } else {
      // 2. Fallback to localStorage
      const saved = localStorage.getItem('upgrad-recent');
      if (saved) {
        try {
          loadedRecents = JSON.parse(saved);
        } catch {
          loadedRecents = [];
        }
      }
    }
    
    // Clean and set only the active recents (within 24 hours)
    const activeRecents = filterExpiredRecents(loadedRecents);
    setRecent(activeRecents);
  }, [profile, filterExpiredRecents]);

  const addRecent = useCallback(async (automationId) => {
    // 1. Filter out expired entries from the existing recent list first!
    const activeExisting = filterExpiredRecents(recent);

    // 2. Compute the updated recents list (put new run at top, remove duplicate, cap at 20)
    const newEntry = { id: automationId.toString(), timestamp: new Date().toISOString() };
    const filtered = activeExisting.filter((item) => item.id.toString() !== automationId.toString());
    const next = [newEntry, ...filtered].slice(0, 20);

    // 3. Optimistically update local state & localStorage cache
    setRecent(next);
    localStorage.setItem('upgrad-recent', JSON.stringify(next));

    // 4. Save to Supabase if user is logged in
    if (user?.id) {
      try {
        const { error } = await updateProfile(user.id, { recents: next });
        if (!error) {
          // Refresh profile context so changes propagate to all components
          refreshProfile();
        }
      } catch (err) {
        console.warn('Failed to sync recents with Supabase:', err.message);
      }
    }
  }, [recent, user, refreshProfile, filterExpiredRecents]);

  return { recent, addRecent, mounted };
}
