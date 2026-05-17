'use client';

import { motion } from 'framer-motion';

export default function ProgramFilter({ activeProgram, onProgramChange, counts = {} }) {
  // Generate program list dynamically from available counts keys, keeping 'All Programs' first
  const programList = Object.keys(counts).sort((a, b) => {
    if (a === 'All Programs') return -1;
    if (b === 'All Programs') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {programList.map((program) => {
        const isActive = activeProgram === program;
        const count = counts[program] || 0;
        
        // Format display name (e.g., "All Programs" -> "All")
        const displayName = program === 'All Programs' ? 'All' : program;

        return (
          <motion.button
            key={program}
            onClick={() => onProgramChange(program)}
            className="relative px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-all duration-200 btn-press border flex items-center gap-1.5 select-none"
            style={{
              background: isActive ? 'var(--foreground)' : 'var(--surface)',
              color: isActive ? 'var(--background)' : 'var(--muted-fg)',
              borderColor: isActive ? 'var(--foreground)' : 'var(--border-color)',
            }}
            whileHover={{
              scale: 1.02,
              borderColor: isActive ? 'var(--foreground)' : 'var(--border-hover)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && (
              <motion.div
                layoutId="program-pill-active"
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--foreground)', zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{displayName}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
