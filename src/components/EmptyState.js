'use client';

import { motion } from 'framer-motion';
import { Star, Inbox } from 'lucide-react';

export default function EmptyState({ type = 'no-results', searchQuery = '' }) {
  const configs = {
    'no-results': {
      icon: Inbox,
      title: 'No automations found',
      description: searchQuery
        ? `No results for "${searchQuery}". Try a different search term.`
        : 'No automations match the selected filter.',
    },
    'no-favorites': {
      icon: Star,
      title: 'No favorites yet',
      description: 'Star your most-used automations to access them quickly from here.',
    },
    'no-recent': {
      icon: Inbox,
      title: 'No recent activity',
      description: 'Tools you open will appear here for quick access.',
    },
  };

  const config = configs[type] || configs['no-results'];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          color: 'var(--muted-fg)',
        }}
      >
        <Icon size={28} />
      </div>
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        {config.title}
      </h3>
      <p
        className="text-sm max-w-sm"
        style={{ color: 'var(--muted-fg)' }}
      >
        {config.description}
      </p>
    </motion.div>
  );
}
