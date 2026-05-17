'use client';

import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 cursor-pointer"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-color)',
      }}
      whileHover={{ scale: 1.05, borderColor: 'var(--border-hover)' }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {theme === 'dark' ? (
          <Moon size={16} style={{ color: 'var(--muted-fg)' }} />
        ) : (
          <Sun size={16} style={{ color: 'var(--muted-fg)' }} />
        )}
      </motion.div>
    </motion.button>
  );
}
