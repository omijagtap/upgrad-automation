'use client';

import { useState } from 'react';
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
  const [showDescTooltip, setShowDescTooltip] = useState(false);
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
      className={`group relative rounded-xl card-shine transition-all duration-300 h-full flex flex-col justify-between ${isDisabled ? 'opacity-60' : ''}`}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        width: '100%',
      }}
      whileHover={{
        scale: isDisabled ? 1 : 1.02,
        boxShadow: isDisabled ? 'none' : '0 8px 40px var(--shadow-color), 0 0 30px var(--glow-color)',
        borderColor: isDisabled ? 'var(--border-color)' : 'var(--border-hover)',
        zIndex: 50,
      }}
    >
      <div className="card-shine-overlay" />
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Top Content Area */}
        <div>
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

              {/* Status and Timer Container - Side-by-side with 20% smaller font size */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 text-[8px] font-normal uppercase tracking-wider rounded-lg ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>

                {(automation.time_saved_per_run > 0 || automation.time_saved_per_day > 0) && (
                  <span
                    className="text-[7.2px] font-normal flex items-center gap-0.5 select-none"
                    style={{
                      color: 'var(--muted-fg)',
                    }}
                  >
                    <Clock size={8} className="text-[#10b981]" />
                    <span>
                      {automation.time_saved_per_run > 0
                        ? `${automation.time_saved_per_run}m saved`
                        : `${automation.time_saved_per_day}m/day`}
                    </span>
                  </span>
                )}
              </div>
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

          {/* Title - Bold, wraps naturally to show full name */}
          <h3
            className="text-[13px] font-semibold mb-1.5 break-words leading-snug"
            style={{ color: 'var(--foreground)' }}
          >
            {name}
          </h3>

          {/* Description - Normal weight with Tooltip */}
          <div 
            className="relative"
            onMouseEnter={() => setShowDescTooltip(true)}
            onMouseLeave={() => setShowDescTooltip(false)}
          >
            <p
              className="text-[11px] leading-relaxed mb-4 line-clamp-2 font-normal cursor-help"
              style={{ color: 'var(--muted-fg)' }}
              title={isDisabled ? statusInfo.message || description : description}
            >
              {isDisabled ? statusInfo.message || description : description}
            </p>
            {/* Custom Tooltip */}
            {showDescTooltip && (
              <div 
                className="absolute z-50 left-0 top-full mt-1 p-2 text-[10px] rounded-lg shadow-xl border backdrop-blur-md w-max max-w-[280px]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border-hover)',
                  color: 'var(--foreground)',
                  boxShadow: '0 4px 20px var(--shadow-color)',
                }}
              >
                <div className="font-medium leading-normal break-words">
                  {isDisabled ? statusInfo.message || description : description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Program + Date + Action (Always perfectly aligned at base) */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.02)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 text-[10px] font-normal rounded-lg"
              style={{
                background: 'var(--surface)',
                color: 'var(--muted-fg)',
                border: '1px solid var(--border-color)',
              }}
            >
              {program}
            </span>
            {updatedAt && (
              <span className="flex items-center gap-1 text-[9px] font-normal" style={{ color: 'var(--muted-fg)' }}>
                {updatedAt}
              </span>
            )}
          </div>

          <motion.button
            onClick={() => !isDisabled && onOpen(automation)}
            disabled={isDisabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-normal rounded-lg transition-all duration-200 btn-press ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
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
