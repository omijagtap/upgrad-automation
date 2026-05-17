'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AutomationCard from '@/components/AutomationCard';
import EmptyState from '@/components/EmptyState';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/lib/supabase';
import { useAutomations } from '@/hooks/useAutomations';

export default function RecentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recent, setRecent] = useState([]);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { automations, loading: autosLoading } = useAutomations();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('upgrad-recent') || '[]');
      setRecent(saved);
    } catch {
      setRecent([]);
    }
  }, []);

  const recentAutomations = useMemo(() => {
    const recentIds = recent.map((r) => r.id.toString());
    let filtered = automations.filter((a) => recentIds.includes(a.id.toString()));
    // Maintain recent order
    filtered.sort((a, b) => recentIds.indexOf(a.id.toString()) - recentIds.indexOf(b.id.toString()));

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
  }, [automations, recent, searchQuery]);

  const handleOpen = useCallback(async (automation) => {
    if (user?.email) {
      logActivity(user.email, automation.name, automation.program).catch(() => {});
    }
    window.open(automation.link, '_blank', 'noopener,noreferrer');
  }, [user]);

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <Clock size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Recent Tools
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Automations you&apos;ve recently accessed.
            </p>
          </motion.div>

          {recentAutomations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {recentAutomations.map((automation, index) => (
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
            <EmptyState type="no-recent" />
          )}
        </div>
      </div>
    </div>
  );
}
