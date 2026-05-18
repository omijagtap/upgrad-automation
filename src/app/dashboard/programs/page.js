'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProgramFilter from '@/components/ProgramFilter';
import AutomationCard from '@/components/AutomationCard';
import EmptyState from '@/components/EmptyState';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/lib/supabase';
import { useAutomations } from '@/hooks/useAutomations';

export default function ProgramsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProgram, setActiveProgram] = useState('All Programs');
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { automations, loading: autosLoading } = useAutomations();

  const filteredAutomations = useMemo(() => {
    // Only display ENABLED automations to the users!
    let filtered = automations.filter((a) => a.enabled !== false);
    if (activeProgram !== 'All Programs') {
      filtered = filtered.filter((a) => a.program === activeProgram);
    }
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
  }, [automations, activeProgram, searchQuery]);

  // Calculate dynamically the count of items in each category
  const programCounts = useMemo(() => {
    const enabledAutos = automations.filter((a) => a.enabled !== false);
    const counts = { 'All Programs': enabledAutos.length };
    enabledAutos.forEach((a) => {
      if (a.program && a.program.trim()) {
        const prog = a.program.trim();
        counts[prog] = (counts[prog] || 0) + 1;
      }
    });
    return counts;
  }, [automations]);

  // Extract dynamic categories list
  const activeProgramsList = useMemo(() => {
    const cats = new Set();
    const enabledAutos = automations.filter((a) => a.enabled !== false);
    enabledAutos.forEach(a => {
      if (a.program && a.program.trim()) {
        cats.add(a.program.trim());
      }
    });
    return Array.from(cats).sort();
  }, [automations]);

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
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <Layers size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Programs
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Browse automations organized by program.
            </p>
          </motion.div>

          {/* Program Stats (Dynamic Cards) */}
          {activeProgramsList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
              {activeProgramsList.map((program, i) => (
                <motion.button
                  key={program}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveProgram(activeProgram === program ? 'All Programs' : program)}
                  className="p-3 rounded-xl cursor-pointer text-center transition-all duration-200"
                  style={{
                    background: activeProgram === program ? 'var(--accent)' : 'var(--card-bg)',
                    border: activeProgram === program ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                    color: activeProgram === program ? '#ffffff' : 'var(--foreground)',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="text-lg font-bold">{programCounts[program] || 0}</div>
                  <div className="text-[10px] font-medium opacity-80 truncate">{program}</div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Filter Pills */}
          <div className="mb-6">
            <ProgramFilter 
              activeProgram={activeProgram} 
              onProgramChange={setActiveProgram} 
              counts={programCounts} 
            />
          </div>

          {/* Grid */}
          {filteredAutomations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAutomations.map((automation, index) => (
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
            <EmptyState type="no-results" searchQuery={searchQuery} />
          )}
        </div>
      </div>
    </div>
  );
}
