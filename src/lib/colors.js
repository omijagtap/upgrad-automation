const PROGRAM_PALETTES = [
  { // 0: Pink/Rose
    dark: { bg: 'rgba(236, 72, 153, 0.08)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.2)', glow: '0 0 10px rgba(236, 72, 153, 0.08)' },
    light: { bg: 'rgba(219, 39, 119, 0.06)', text: '#be185d', border: 'rgba(219, 39, 119, 0.15)', glow: '0 0 8px rgba(219, 39, 119, 0.03)' }
  },
  { // 1: Emerald/Green
    dark: { bg: 'rgba(16, 185, 129, 0.08)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)', glow: '0 0 10px rgba(16, 185, 129, 0.08)' },
    light: { bg: 'rgba(5, 150, 105, 0.06)', text: '#047857', border: 'rgba(5, 150, 105, 0.15)', glow: '0 0 8px rgba(5, 150, 105, 0.03)' }
  },
  { // 2: Violet/Purple
    dark: { bg: 'rgba(139, 92, 246, 0.08)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)', glow: '0 0 10px rgba(139, 92, 246, 0.08)' },
    light: { bg: 'rgba(124, 58, 237, 0.06)', text: '#6d28d9', border: 'rgba(124, 58, 237, 0.15)', glow: '0 0 8px rgba(124, 58, 237, 0.03)' }
  },
  { // 3: Amber/Orange
    dark: { bg: 'rgba(245, 158, 11, 0.08)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)', glow: '0 0 10px rgba(245, 158, 11, 0.08)' },
    light: { bg: 'rgba(217, 119, 6, 0.06)', text: '#b45309', border: 'rgba(217, 119, 6, 0.15)', glow: '0 0 8px rgba(217, 119, 6, 0.03)' }
  },
  { // 4: Cyan/Teal
    dark: { bg: 'rgba(6, 182, 212, 0.08)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.2)', glow: '0 0 10px rgba(6, 182, 212, 0.08)' },
    light: { bg: 'rgba(13, 148, 136, 0.06)', text: '#0f766e', border: 'rgba(13, 148, 136, 0.15)', glow: '0 0 8px rgba(13, 148, 136, 0.03)' }
  },
  { // 5: Blue/Indigo
    dark: { bg: 'rgba(59, 130, 246, 0.08)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)', glow: '0 0 10px rgba(59, 130, 246, 0.08)' },
    light: { bg: 'rgba(37, 99, 235, 0.06)', text: '#1d4ed8', border: 'rgba(37, 99, 235, 0.15)', glow: '0 0 8px rgba(37, 99, 235, 0.03)' }
  },
  { // 6: Red/Rose
    dark: { bg: 'rgba(242, 62, 54, 0.08)', text: '#f87171', border: 'rgba(242, 62, 54, 0.2)', glow: '0 0 10px rgba(242, 62, 54, 0.08)' },
    light: { bg: 'rgba(220, 38, 38, 0.06)', text: '#b91c1c', border: 'rgba(220, 38, 38, 0.15)', glow: '0 0 8px rgba(220, 38, 38, 0.03)' }
  },
  { // 7: Lime/Olive
    dark: { bg: 'rgba(132, 204, 22, 0.08)', text: '#a3e635', border: 'rgba(132, 204, 22, 0.2)', glow: '0 0 10px rgba(132, 204, 22, 0.08)' },
    light: { bg: 'rgba(101, 163, 13, 0.06)', text: '#4d7c0f', border: 'rgba(101, 163, 13, 0.15)', glow: '0 0 8px rgba(101, 163, 13, 0.03)' }
  }
];

const PREDEFINED_MAP = {
  'MBA': 0,
  'BBA': 1,
  'EXECUTIVE MBA': 2,
  'MBMT': 3,
  'OPERATIONS': 4,
  'ANALYTICS': 5,
  'PGDM': 6,
  'CENTRAL': 8,
  'OTHERS': 7
};

export function getProgramColors(program, isDarkMode) {
  if (!program) {
    return {
      bg: 'var(--surface)',
      text: 'var(--muted-fg)',
      border: 'var(--border-color)',
      glow: 'none'
    };
  }

  const name = program.toUpperCase().trim();

  // If standard predefined program, return hand-picked premium colors
  if (PREDEFINED_MAP[name] !== undefined) {
    const index = PREDEFINED_MAP[name];
    const palette = PROGRAM_PALETTES[index];
    return isDarkMode ? palette.dark : palette.light;
  }

  // For custom program names, dynamically generate a unique HSL color
  // with high contrast, accessibility, and premium glassmorphism
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (31 * hash + name.charCodeAt(i)) | 0;
  }
  
  // Dynamic Hue between 0 and 360
  const hue = Math.abs(hash) % 360;

  if (isDarkMode) {
    // Premium neon glassmorphism for dark mode
    return {
      bg: `hsla(${hue}, 80%, 12%, 0.4)`,
      text: `hsl(${hue}, 85%, 70%)`,
      border: `hsla(${hue}, 80%, 40%, 0.25)`,
      glow: `0 0 12px hsla(${hue}, 80%, 50%, 0.08)`
    };
  } else {
    // Clean, readable pastel glassmorphism for light mode
    return {
      bg: `hsla(${hue}, 70%, 95%, 0.6)`,
      text: `hsl(${hue}, 85%, 32%)`,
      border: `hsla(${hue}, 70%, 50%, 0.18)`,
      glow: `0 0 8px hsla(${hue}, 70%, 50%, 0.03)`
    };
  }
}
