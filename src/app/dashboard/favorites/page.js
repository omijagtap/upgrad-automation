'use client';

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AutomationCard from '@/components/AutomationCard';
import EmptyState from '@/components/EmptyState';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecents } from '@/hooks/useRecents';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/lib/supabase';
import { useAutomations } from '@/hooks/useAutomations';
import { useState } from 'react';

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { addRecent } = useRecents();
  const { user } = useAuth();
  const { automations, loading: autosLoading } = useAutomations();

  const favoriteAutomations = useMemo(() => {
    // Map favorite IDs to match their string representation in allAutos
    const favStrings = favorites.map(id => id.toString());
    let filtered = automations.filter((a) => favStrings.includes(a.id.toString()));
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.program.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [automations, favorites, searchQuery]);

  const handleOpen = useCallback(async (automation) => {
    if (user?.email) {
      logActivity(user.email, automation.name, automation.program).catch(() => {});
    }
    // Save to recents when opened from Favorites page too
    addRecent(automation.id).catch(() => {});
    window.open(automation.link, '_blank', 'noopener,noreferrer');
  }, [user, addRecent]);

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mr-auto px-4 md:px-6 py-6 md:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <Star size={18} style={{ color: '#f59e0b' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Favorites
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Your bookmarked automation tools for quick access.
            </p>
          </motion.div>

          {favoriteAutomations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {favoriteAutomations.map((automation, index) => (
                  <AutomationCard
                    key={automation.id}
                    automation={automation}
                    isFavorite={isFavorite(automation.id)}
                    onToggleFavorite={toggleFavorite}
                    onOpen={handleOpen}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState type="no-favorites" />
          )}
        </div>
      </div>
    </div>
  );
}
