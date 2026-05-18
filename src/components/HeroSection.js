'use client';

import { motion } from 'framer-motion';

export default function HeroSection({ totalLive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative mb-6"
    >
      <div className="relative z-10">
        {/* Status pill at the top (Matches User Screenshot) */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <span className="live-dot" />
          <span className="text-[11px] font-normal" style={{ color: 'var(--foreground)' }}>
            {totalLive} automation tools live
          </span>
        </motion.div>

        {/* Heading Welcome Title */}
        <motion.h1
          className="text-2xl md:text-3xl font-semibold tracking-tight mb-2"
          style={{ color: 'var(--foreground)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Welcome to <span className="logo-shimmer">upGrad</span>{' '}
          <span className="font-light" style={{ color: 'var(--muted-fg)' }}>
            Automation
          </span>
        </motion.h1>

        {/* Detailed description paragraph */}
        <motion.p
          className="text-[13px] leading-relaxed max-w-2xl"
          style={{ color: 'var(--muted-fg)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Your centralized hub for every internal automation. One click access — no scripts, no setup, no friction. Search, launch and ship outcomes faster than ever.
        </motion.p>
      </div>
    </motion.div>
  );
}
