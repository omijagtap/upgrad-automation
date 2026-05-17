'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDbAutomations, createDbAutomation, updateDbAutomation, deleteDbAutomation, isSupabaseConfigured } from '@/lib/supabase';
import staticAutomations from '@/data/automations';

export function useAutomations() {
  const [dbAutomations, setDbAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDbAutomations = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setDbAutomations([]);
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await getDbAutomations();
      if (!error && data) {
        // Map database naming (snake_case) to application properties if needed,
        // and ensure ID is unique (e.g. prefixing or using DB id)
        const mapped = data.map(item => ({
          ...item,
          id: item.id.toString(), // Convert to string to avoid conflict with static numeric IDs
          icon: 'GraduationCap',   // Enforce Graduation Cap icon as requested
          updatedAt: item.updated_at ? item.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]
        }));
        setDbAutomations(mapped);
      }
    } catch (err) {
      console.warn('Failed to load dynamic automations from Supabase:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDbAutomations();
  }, [fetchDbAutomations]);

  // Only return custom DB-created automations (Static mock cards are disabled)
  const allAutomations = useMemo(() => {
    return dbAutomations;
  }, [dbAutomations]);

  // Add new automation
  const addAutomation = useCallback(async (newCard) => {
    if (!isSupabaseConfigured()) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await createDbAutomation({
      name: newCard.name,
      description: newCard.description,
      program: newCard.program,
      link: newCard.link,
      icon: newCard.icon || 'Zap',
      enabled: newCard.enabled !== undefined ? newCard.enabled : true,
      status: newCard.status || 'live'
    });

    if (!error && data) {
      await fetchDbAutomations();
    }
    return { data, error };
  }, [fetchDbAutomations]);

  // Update status or enabled toggles
  const updateAutomation = useCallback(async (id, updates) => {
    // If it's a static card (doesn't exist in dbAutomations), we update it in local state
    const isDbCard = dbAutomations.some(item => item.id === id);
    
    if (isDbCard && isSupabaseConfigured()) {
      const { data, error } = await updateDbAutomation(id, updates);
      if (!error && data) {
        await fetchDbAutomations();
      }
      return { data, error };
    } else {
      // Local fallback for static mock updating in UI
      setDbAutomations(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      return { data: null, error: null };
    }
  }, [dbAutomations, fetchDbAutomations]);

  // Delete dynamic automation
  const deleteAutomation = useCallback(async (id) => {
    const isDbCard = dbAutomations.some(item => item.id === id);
    
    if (isDbCard && isSupabaseConfigured()) {
      const { error } = await deleteDbAutomation(id);
      if (!error) {
        await fetchDbAutomations();
      }
      return { error };
    }
    return { error: 'Static automations cannot be deleted from database' };
  }, [dbAutomations, fetchDbAutomations]);

  return {
    automations: allAutomations,
    dbAutomations,
    loading,
    refresh: fetchDbAutomations,
    addAutomation,
    updateAutomation,
    deleteAutomation
  };
}
