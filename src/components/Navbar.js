'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ searchQuery, onSearchChange }) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-40 glass-strong"
      style={{
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between h-[52px] pl-[52px] pr-4 md:px-6">
        {/* Breadcrumb Info (Left) - Hidden Dashboard parent on mobile for clean fit */}
        <div className="flex items-center gap-1.5 text-[12.8px] font-medium tracking-tight select-none">
          <span className="hidden sm:inline" style={{ color: 'var(--muted-fg)' }}>Dashboard</span>
          <span className="hidden sm:inline" style={{ color: 'var(--border-color)', opacity: 0.6 }}>/</span>
          <span style={{ color: 'var(--foreground)' }}>Automations</span>
        </div>

        {/* Right Section (Search bar + Toggle) */}
        <div className="flex items-center gap-2 xs:gap-3">
          {/* Search Input Box - Responsive width to fit narrow mobile displays */}
          <div
            className="relative flex items-center transition-all duration-300 rounded-lg w-[120px] xs:w-[160px] sm:w-[220px] md:w-[320px]"
            style={{
              background: 'var(--input-bg)',
              border: focused ? '1px solid var(--accent)' : '1px solid var(--border-color)',
              boxShadow: focused ? '0 0 20px var(--glow-color)' : 'none',
            }}
          >
            <Search
              size={14}
              className="absolute left-2.5 pointer-events-none"
              style={{ color: 'var(--muted-fg)' }}
            />
            <input
              type="text"
              placeholder="Search automations, categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full py-1.5 pl-8 pr-12 text-[12.6px] bg-transparent border-0 rounded-lg focus:ring-0"
              style={{
                color: 'var(--foreground)',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
            
            {/* Shortcut key or Clear search */}
            <div className="absolute right-2 flex items-center pointer-events-none">
              <AnimatePresence mode="wait">
                {searchQuery ? (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange('');
                    }}
                    className="pointer-events-auto p-0.5 rounded-md hover:bg-white/10"
                    style={{ color: 'var(--muted-fg)' }}
                  >
                    <X size={13} />
                  </motion.button>
                ) : (
                  <motion.span
                    key="shortcut"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[9.5px] px-1.5 py-0.5 rounded border font-mono tracking-widest leading-none select-none opacity-55"
                    style={{
                      borderColor: 'var(--border-color)',
                      background: 'var(--surface)',
                      color: 'var(--muted-fg)',
                    }}
                  >
                    ⌘K
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}
