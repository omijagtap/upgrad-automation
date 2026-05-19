'use client';

import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProgramFilter from '@/components/ProgramFilter';
import AutomationCard from '@/components/AutomationCard';
import EmptyState from '@/components/EmptyState';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecents } from '@/hooks/useRecents';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/lib/supabase';
import { useAutomations } from '@/hooks/useAutomations';

export default function DashboardHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProgram, setActiveProgram] = useState('All Programs');
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addRecent } = useRecents();
  const { user } = useAuth();
  const { automations, loading: autosLoading } = useAutomations();

  // Filter automations
  const filteredAutomations = useMemo(() => {
    // Only display ENABLED automations to the users!
    let filtered = automations.filter((a) => a.enabled !== false);

    // Filter by program
    if (activeProgram !== 'All Programs') {
      filtered = filtered.filter((a) => a.program === activeProgram);
    }

    // Filter by search
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
  }, [automations, searchQuery, activeProgram]);

  // Count live automations
  const totalLive = useMemo(() => {
    return automations.filter((a) => a.enabled && a.status === 'live').length;
  }, [automations]);

  // Calculate dynamically the count of items in each category
  const programCounts = useMemo(() => {
    const enabledAutos = automations.filter((a) => a.enabled !== false);
    const counts = { 'All Programs': enabledAutos.length };
    enabledAutos.forEach((a) => {
      counts[a.program] = (counts[a.program] || 0) + 1;
    });
    return counts;
  }, [automations]);

  // Handle opening an automation
  const handleOpen = useCallback(async (automation) => {
    // Log activity
    if (user?.email) {
      logActivity(user.email, automation.name, automation.program).catch(() => { });
    }

    // Save to recent tools (synced to Supabase & cached locally)
    addRecent(automation.id).catch(() => { });

    // Open link
    window.open(automation.link, '_blank', 'noopener,noreferrer');
  }, [user, addRecent]);

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-8xl mr-auto px-4 md:px-6 py-4 md:py-6">
          {/* Hero Section */}
          <HeroSection totalLive={totalLive} />

          {/* Section Header: All Automations (Exactly as in Reference Image) */}
          <div className="flex items-end justify-between mb-3 mt-6">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">All Automations</h2>
              <p className="text-[11px] text-muted-fg mt-0.5">Browse, filter or search the full toolkit.</p>
            </div>
          </div>

          {/* Program Filter */}
          <div className="mb-5">
            <ProgramFilter
              activeProgram={activeProgram}
              onProgramChange={setActiveProgram}
              counts={programCounts}
            />
          </div>

          {/* Automation Grid */}
          {filteredAutomations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
