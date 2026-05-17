'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Moon, Sun } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
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
                <SettingsIcon size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Settings
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Manage your preferences and account settings.
            </p>
          </motion.div>

          <div className="space-y-4">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <User size={16} style={{ color: 'var(--muted-fg)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Profile
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Name</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                    {profile?.name || 'Not set'}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between py-2"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Email</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                    {profile?.email || 'Not set'}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between py-2"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Role</span>
                  <span
                    className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {profile?.role?.replace('_', ' ') || 'user'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Theme Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon size={16} style={{ color: 'var(--muted-fg)' }} />
                  ) : (
                    <Sun size={16} style={{ color: 'var(--muted-fg)' }} />
                  )}
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Appearance
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={toggleTheme}
                  className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border-color)',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </motion.button>
              </div>
            </motion.div>

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                About
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--muted-fg)' }}>Version</span>
                  <span style={{ color: 'var(--foreground)' }}>1.0.0</span>
                </div>
                <div className="flex justify-between text-xs" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span style={{ color: 'var(--muted-fg)' }}>Platform</span>
                  <span style={{ color: 'var(--foreground)' }}>upGrad Automation Portal</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
