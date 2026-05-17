'use client';

import { motion } from 'framer-motion';
import { Star, ExternalLink, Clock, AlertTriangle, Wrench, Code, GraduationCap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const statusConfig = {
  live: {
    label: 'Live',
    className: 'status-live',
  },
  maintenance: {
    label: 'Under Maintenance',
    className: 'status-maintenance',
    icon: Wrench,
    message: 'Temporarily unavailable for maintenance',
  },
  development: {
    label: 'In Development',
    className: 'status-development',
    icon: Code,
    message: 'Currently being developed',
  },
  unavailable: {
    label: 'Unavailable',
    className: 'status-unavailable',
    icon: AlertTriangle,
    message: 'Temporarily unavailable',
  },
};

export default function AutomationCard({ automation, isFavorite, onToggleFavorite, onOpen, index = 0 }) {
  const { name, description, program, icon, enabled, status, updatedAt } = automation;
  const isDisabled = !enabled || status !== 'live';
  const statusInfo = statusConfig[status] || statusConfig.live;

  // Enforce common GraduationCap icon for all automation cards
  const IconComponent = GraduationCap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      className={`group relative rounded-xl card-shine transition-all duration-300 ${isDisabled ? 'opacity-60' : ''}`}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
      }}
      whileHover={!isDisabled ? {
        scale: 1.015,
        boxShadow: '0 8px 40px var(--shadow-color), 0 0 30px var(--glow-color)',
        borderColor: 'var(--border-hover)',
      } : {}}
    >
      <div className="p-4">
        {/* Top Row: Icon + Status + Favorite */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                color: isDisabled ? 'var(--muted-fg)' : 'var(--accent)',
              }}
            >
              <IconComponent size={15} />
            </div>
            <span
              className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(automation.id);
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg cursor-pointer transition-all duration-200"
            style={{
              color: isFavorite ? '#f59e0b' : 'var(--muted-fg)',
            }}
          >
            <Star
              size={16}
              fill={isFavorite ? '#f59e0b' : 'none'}
            />
          </motion.button>
        </div>

        {/* Title */}
        <h3
          className="text-[13px] font-semibold mb-1 line-clamp-1"
          style={{ color: 'var(--foreground)' }}
        >
          {name}
        </h3>

        {/* Description */}
        <p
          className="text-[11px] leading-relaxed mb-3 line-clamp-2"
          style={{ color: 'var(--muted-fg)' }}
        >
          {isDisabled ? statusInfo.message || description : description}
        </p>

        {/* Bottom Row: Program + Date + Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="px-2.5 py-1 text-[10px] font-medium rounded-lg"
              style={{
                background: 'var(--surface)',
                color: 'var(--muted-fg)',
                border: '1px solid var(--border-color)',
              }}
            >
              {program}
            </span>
            {updatedAt && (
              <span className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--muted-fg)' }}>
                <Clock size={9} />
                {updatedAt}
              </span>
            )}
          </div>

          <motion.button
            onClick={() => !isDisabled && onOpen(automation)}
            disabled={isDisabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all duration-200 btn-press ${
              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              background: isDisabled ? 'var(--surface)' : 'var(--accent)',
              color: isDisabled ? 'var(--muted-fg)' : '#ffffff',
              border: isDisabled ? '1px solid var(--border-color)' : '1px solid var(--accent)',
            }}
            whileHover={!isDisabled ? { scale: 1.05, boxShadow: '0 0 15px var(--glow-color)' } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
          >
            <ExternalLink size={12} />
            Open
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
