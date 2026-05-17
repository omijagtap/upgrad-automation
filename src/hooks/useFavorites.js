'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { updateProfile } from '@/lib/supabase';

export function useFavorites() {
  const { user, profile, refreshProfile } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Load initial favorites (prioritize profile.favorites, fallback to localStorage)
  useEffect(() => {
    setMounted(true);
    
    let loadedFavs = [];
    
    // 1. Try to load from Supabase user profile
    if (profile && Array.isArray(profile.favorites)) {
      loadedFavs = profile.favorites;
    } else {
      // 2. Fallback to localStorage
      const saved = localStorage.getItem('upgrad-favorites');
      if (saved) {
        try {
          loadedFavs = JSON.parse(saved);
        } catch {
          loadedFavs = [];
        }
      }
    }
    
    setFavorites(loadedFavs);
  }, [profile]);

  const toggleFavorite = useCallback(async (automationId) => {
    // Determine next favorites array
    let next;
    setFavorites((prev) => {
      next = prev.includes(automationId)
        ? prev.filter((id) => id !== automationId)
        : [...prev, automationId];
        
      // Keep localStorage in sync as cache/fallback
      localStorage.setItem('upgrad-favorites', JSON.stringify(next));
      return next;
    });

    // Asynchronously save to Supabase if user is logged in
    if (user?.id) {
      try {
        const { error } = await updateProfile(user.id, { favorites: next });
        if (!error) {
          // Refresh profile context so changes propagate to all components
          refreshProfile();
        }
      } catch (err) {
        console.warn('Failed to sync favorites with Supabase:', err.message);
      }
    }
  }, [user, refreshProfile]);

  const isFavorite = useCallback((automationId) => {
    return favorites.includes(automationId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite, mounted };
}
