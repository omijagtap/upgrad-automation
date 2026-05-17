'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function AnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                }}
              >
                <BarChart3 size={18} style={{ color: '#ec4899' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Analytics
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Detailed usage metrics and advanced platform telemetry.
            </p>
          </motion.div>

          {/* Premium Blank State / Coming Soon Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-12 text-center flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              borderColor: 'var(--border-color)',
              borderWidth: '1px',
              borderStyle: 'solid',
              minHeight: '380px',
              background: 'var(--card-bg)',
            }}
          >
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
              style={{
                background: 'rgba(236, 72, 153, 0.08)',
                border: '1px solid rgba(236, 72, 153, 0.15)',
              }}
            >
              <BarChart3 size={24} style={{ color: '#ec4899' }} className="animate-pulse" />
            </div>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              Telemetry Engine Launching Soon
            </h2>
            <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
              We are building a custom tracking and telemetry interface tailored to your specific operations reporting plans. Live platform metrics and activity logs will be activated soon.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
