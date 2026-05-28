'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Sparkles, AlertCircle, ShieldAlert, CheckCircle2, Terminal, Calendar, LayoutDashboard } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAutomations } from '@/hooks/useAutomations';
import { useTheme } from '@/hooks/useTheme';
import { getProgramColors } from '@/lib/colors';

// Helper to calculate daily minutes saved from an automation's run profile
function getDailyMinutesSaved(auto) {
  if (auto.time_saved_per_run > 0 && auto.frequency_per_week > 0) {
    // Calculates weekly time saved (run time * frequency) and distributes it over 5 business days
    return (Number(auto.time_saved_per_run) * Number(auto.frequency_per_week)) / 5;
  }
  return Number(auto.time_saved_per_day) || 0;
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const { automations, loading } = useAutomations();

  // Period Preset Selection
  const [selectedPreset, setSelectedPreset] = useState('current_month');
  const [customStart, setCustomStart] = useState('2026-04-01');
  const [customEnd, setCustomEnd] = useState('2026-06-30');

  // Filter automations that are enabled
  const activeAutos = useMemo(() => {
    return automations.filter(a => a.enabled !== false);
  }, [automations]);

  // Operational Presets Configuration (Week, Month, Quarters)
  const presets = useMemo(() => {
    const today = new Date();
    
    // Current Month (1st to end of month)
    const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const mEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Current Week (Monday to Friday)
    const day = today.getDay();
    const mondayDiff = day === 0 ? -6 : 1 - day;
    const wStart = new Date(today);
    wStart.setDate(today.getDate() + mondayDiff);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 4);

    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      current_week: { label: 'Current Week', start: formatDate(wStart), end: formatDate(wEnd) },
      current_month: { label: 'Current Month', start: formatDate(mStart), end: formatDate(mEnd) },
      q1: { label: 'Q1 2026 (Apr - Jun)', start: '2026-04-01', end: '2026-06-30' },
      q2: { label: 'Q2 2026 (Jul - Sep)', start: '2026-07-01', end: '2026-09-30' },
      q3: { label: 'Q3 2026 (Oct - Dec)', start: '2026-10-01', end: '2026-12-31' },
      q4: { label: 'Q4 2026 (Jan - Mar)', start: '2026-01-01', end: '2026-03-31' },
      year: { label: 'Full Year 2026', start: '2026-01-01', end: '2026-12-31' },
      custom: { label: 'Custom Range', start: '', end: '' }
    };
  }, []);

  // Compute active date boundaries
  const activeDateRange = useMemo(() => {
    if (selectedPreset === 'custom') {
      return { start: customStart, end: customEnd };
    }
    return {
      start: presets[selectedPreset].start,
      end: presets[selectedPreset].end
    };
  }, [selectedPreset, customStart, customEnd]);

  // Helper to count working days (Mondays to Fridays) in selected range
  const totalWorkingDays = useMemo(() => {
    if (!activeDateRange.start || !activeDateRange.end) return 0;
    const start = new Date(activeDateRange.start);
    const end = new Date(activeDateRange.end);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    let count = 0;
    let current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Mon-Fri
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }, [activeDateRange]);

  // Compute total active daily minutes saved across enabled automations
  const totalDailyMinutesSaved = useMemo(() => {
    return activeAutos.reduce((sum, a) => sum + getDailyMinutesSaved(a), 0);
  }, [activeAutos]);

  // Baseline standard capacity calculations
  const metrics = useMemo(() => {
    const weeklyMins = totalDailyMinutesSaved * 5;
    const monthlyHours = (weeklyMins * 4.33) / 60;
    const annualHours = (weeklyMins * 52) / 60;
    const workdaysSavedPerYear = annualHours / 8;

    return {
      minutesPerDay: Math.round(totalDailyMinutesSaved),
      hoursPerWeek: (weeklyMins / 60).toFixed(1),
      hoursPerMonth: monthlyHours.toFixed(0),
      workdaysSavedPerYear: workdaysSavedPerYear.toFixed(1),
    };
  }, [totalDailyMinutesSaved]);

  // Selected period-specific capacity metrics (8-hour standard workdays)
  const periodMetrics = useMemo(() => {
    const totalMinutesPeriod = totalDailyMinutesSaved * totalWorkingDays;
    const totalHoursPeriod = totalMinutesPeriod / 60;
    const totalDaysPeriod = totalHoursPeriod / 8;

    return {
      workingDays: totalWorkingDays,
      hoursSaved: totalHoursPeriod.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      daysSaved: totalDaysPeriod.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      dailyMinsSaved: Math.round(totalDailyMinutesSaved),
    };
  }, [totalDailyMinutesSaved, totalWorkingDays]);

  // Month-by-month weekday time savings accumulation
  const monthlyAccumulation = useMemo(() => {
    if (!activeDateRange.start || !activeDateRange.end || totalWorkingDays === 0) return [];
    
    const start = new Date(activeDateRange.start);
    const end = new Date(activeDateRange.end);
    const monthData = {};

    let current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        const monthKey = current.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthData[monthKey] = (monthData[monthKey] || 0) + 1;
      }
      current.setDate(current.getDate() + 1);
    }

    return Object.entries(monthData).map(([monthLabel, weekdaysCount]) => {
      const hoursSaved = (weekdaysCount * totalDailyMinutesSaved) / 60;
      const daysSaved = hoursSaved / 8;
      return {
        month: monthLabel,
        weekdays: weekdaysCount,
        hours: Math.round(hoursSaved),
        days: daysSaved.toFixed(1),
      };
    });
  }, [activeDateRange, totalDailyMinutesSaved, totalWorkingDays]);

  // Program efficiency breakdown inside active range
  const periodProgramBreakdown = useMemo(() => {
    const categories = {};
    activeAutos.forEach(a => {
      const dailyMinutes = getDailyMinutesSaved(a);
      categories[a.program] = (categories[a.program] || 0) + (dailyMinutes * totalWorkingDays);
    });

    const totalMinutes = Object.values(categories).reduce((sum, t) => sum + t, 0);

    return Object.entries(categories)
      .map(([name, minutes]) => {
        const hours = minutes / 60;
        const days = hours / 8;
        return {
          name,
          minutes,
          hours: hours.toFixed(1),
          days: days.toFixed(1),
          percentage: totalMinutes > 0 ? ((minutes / totalMinutes) * 100).toFixed(0) : 0,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [activeAutos, totalWorkingDays]);

  // Individual Leaderboard calculations inside active range
  const periodLeaderboard = useMemo(() => {
    return activeAutos
      .map(auto => {
        const dailyMinutes = getDailyMinutesSaved(auto);
        
        const totalMinutes = dailyMinutes * totalWorkingDays;
        const hours = totalMinutes / 60;
        const days = hours / 8;

        return {
          ...auto,
          dailyMinutes,
          totalMinutes,
          hours: hours.toFixed(1),
          days: days.toFixed(1),
        };
      })
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [activeAutos, totalWorkingDays]);

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-8xl mr-auto px-4 md:px-6 py-6 md:py-8">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'rgba(236, 72, 153, 0.08)',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                }}
              >
                <BarChart3 size={18} style={{ color: '#ec4899' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  Manager Analytics View
                </h1>
                <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                  Interactive operational analysis and workday calculations.
                </p>
              </div>
            </motion.div>

            {/* Period Selector Controls */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3 bg-surface p-2.5 rounded-2xl border"
              style={{ borderColor: 'var(--border-color)', background: 'var(--card-bg)' }}
            >
              <div className="flex items-center gap-2">
                <Calendar size={13} style={{ color: 'var(--muted-fg)' }} />
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--muted-fg)' }}>
                  Active Period:
                </span>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--foreground)',
                  }}
                >
                  <option value="current_week">Current Week</option>
                  <option value="current_month">Current Month</option>
                  <option value="q1">Q1 2026 (Apr - Jun)</option>
                  <option value="q2">Q2 2026 (Jul - Sep)</option>
                  <option value="q3">Q3 2026 (Oct - Dec)</option>
                  <option value="q4">Q4 2026 (Jan - Mar)</option>
                  <option value="year">Full Year 2026</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {selectedPreset === 'custom' && (
                <div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: 'var(--border-color)' }}>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg cursor-pointer"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg cursor-pointer"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              )}
            </motion.div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Loading telemetry data...</span>
            </div>
          ) : activeAutos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-12 text-center flex flex-col items-center justify-center"
              style={{
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                minHeight: '300px',
              }}
            >
              <AlertCircle size={32} className="text-zinc-500 mb-3" />
              <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No Automations Tracked Yet</h2>
              <p className="text-xs max-w-sm" style={{ color: 'var(--muted-fg)' }}>
                Create custom automation cards with &quot;Time Saved&quot; data in the Authority Panel to populate operational savings charts.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              
              {/* Highlighted Period Impact Summary */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(242, 62, 54, 0.08) 0%, rgba(10, 10, 12, 0.45) 100%)'
                    : 'linear-gradient(135deg, rgba(242, 62, 54, 0.04) 0%, rgba(255, 255, 255, 0.9) 100%)',
                  border: theme === 'dark'
                    ? '1px solid rgba(242, 62, 54, 0.2)'
                    : '1px solid rgba(242, 62, 54, 0.15)',
                  boxShadow: theme === 'dark'
                    ? '0 0 20px rgba(242, 62, 54, 0.03)'
                    : '0 0 20px rgba(242, 62, 54, 0.02)',
                }}
              >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent" style={{ color: 'var(--accent)' }}>
                        Selected Period Reclaimed Impact
                      </span>
                      <div className="live-dot" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                      Capacity Reclaimed in {selectedPreset === 'custom' ? 'Custom Range' : presets[selectedPreset].label}
                    </h2>
                    <p className="text-xs max-w-2xl" style={{ color: 'var(--muted-fg)' }}>
                      Total operational person-hours and practical business working days reclaimed from manual operations between{' '}
                      <span className="font-semibold text-foreground">{activeDateRange.start}</span> and{' '}
                      <span className="font-semibold text-foreground">{activeDateRange.end}</span>.
                    </p>
                    <div className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg border bg-surface mt-2" style={{ borderColor: 'var(--border-color)', color: 'var(--muted-fg)' }}>
                      {periodMetrics.workingDays} Business Weekdays (Mon - Fri)
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 md:gap-12 min-w-[280px]">
                    {/* Reclaimed Hours */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>
                        Hours Reclaimed
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight text-foreground">
                          {periodMetrics.hoursSaved}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>hours</span>
                      </div>
                    </div>

                    {/* Reclaimed Practical Days */}
                    <div className="space-y-1 p-3.5 rounded-xl border" style={{
                      background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Workdays Saved (8h)
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
                          {periodMetrics.daysSaved}
                        </span>
                        <span className="text-xs text-emerald-400">days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Standard Baseline Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Metric 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>
                      Weekly Reclaimed Time
                    </span>
                    <TrendingUp size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-emerald-500">
                      {metrics.hoursPerWeek}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>hours/week</span>
                  </div>
                  <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
                    Based on standard 5-day ops cycle, saving hours of manual workload.
                  </p>
                </motion.div>

                {/* Metric 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>
                      Monthly Capacity Gain
                    </span>
                    <Sparkles size={16} className="text-violet-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-violet-500">
                      {metrics.hoursPerMonth}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>hours/month</span>
                  </div>
                  <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
                    Frees up team capacity for strategic cohort tasks.
                  </p>
                </motion.div>

                {/* Metric 3 */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>
                      Annual Workdays Reclaimed
                    </span>
                    <CheckCircle2 size={16} className="text-blue-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-blue-500">
                      {metrics.workdaysSavedPerYear}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>workdays/yr</span>
                  </div>
                  <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
                    Calculated at 8 hours of work per standard business workday.
                  </p>
                </motion.div>
              </div>

              {/* Advanced Graphs and List Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Month-by-Month Accumulation Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="lg:col-span-2 rounded-2xl p-5 flex flex-col"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    Monthly Accumulation
                  </h3>
                  <p className="text-[10px] mb-6" style={{ color: 'var(--muted-fg)' }}>
                    Calculated working weekdays in each month multiplied by team daily saved hours.
                  </p>

                  {monthlyAccumulation.length > 0 ? (
                    <div className="flex-1 flex items-end justify-between gap-3 pt-6 min-h-[180px] px-2">
                      {(() => {
                        const maxHours = Math.max(...monthlyAccumulation.map(m => m.hours), 1);
                        return monthlyAccumulation.map((m, idx) => {
                          const percentage = (m.hours / maxHours) * 100;
                          return (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-[calc(100%+8px)] rounded-lg p-2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 min-w-[90px] shadow-xl border"
                                   style={{
                                     background: theme === 'dark' ? 'rgba(10, 10, 12, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                                     borderColor: 'var(--border-color)',
                                   }}
                              >
                                <p className="text-[10px] font-bold" style={{ color: 'var(--foreground)' }}>{m.month}</p>
                                <p className="text-[9px] font-semibold" style={{ color: 'var(--accent)' }}>{m.hours} hrs saved</p>
                                <p className="text-[9px]" style={{ color: 'var(--muted-fg)' }}>{m.days} days ({m.weekdays} weekdays)</p>
                              </div>

                              {/* Number Label */}
                              <span className="text-[10px] font-semibold text-foreground">
                                {m.hours}h
                              </span>

                              {/* Bar */}
                              <div className="w-full max-w-[48px] h-32 rounded-lg overflow-hidden relative border"
                                   style={{
                                     background: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
                                     borderColor: 'var(--border-color)',
                                   }}
                              >
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${percentage}%` }}
                                  transition={{ duration: 0.8, delay: idx * 0.05 }}
                                  className="absolute bottom-0 left-0 right-0 rounded-b-lg"
                                  style={{
                                    background: 'linear-gradient(180deg, var(--accent) 0%, rgba(242, 62, 54, 0.4) 100%)',
                                    boxShadow: '0 0 15px rgba(242, 62, 54, 0.25)',
                                  }}
                                />
                              </div>

                              {/* Axis Label */}
                              <span className="text-[9px] font-medium text-center truncate w-full" style={{ color: 'var(--muted-fg)' }}>
                                {m.month}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-12 text-center text-xs" style={{ color: 'var(--muted-fg)' }}>
                      No data to show for selected range.
                    </div>
                  )}
                </motion.div>

                {/* Right: Program Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="lg:col-span-1 rounded-2xl p-5 flex flex-col"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    Efficiency by Program
                  </h3>
                  <p className="text-[10px] mb-5" style={{ color: 'var(--muted-fg)' }}>
                    Distribution of daily saved minutes across cohorts.
                  </p>

                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[220px] pr-1">
                    {periodProgramBreakdown.map((prog, idx) => (
                      <div key={prog.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span style={{ color: 'var(--foreground)' }} className="truncate max-w-[120px]">{prog.name}</span>
                          <span style={{ color: 'var(--muted-fg)' }}>{Math.round(prog.hours)} hrs ({prog.percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden relative"
                             style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${prog.percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.05 * idx }}
                            className="h-full rounded-full"
                            style={{
                              background: idx % 3 === 0
                                ? 'linear-gradient(90deg, #ec4899, #f43f5e)'
                                : idx % 3 === 1
                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                : 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
                              boxShadow: '0 0 8px rgba(236,72,153,0.15)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </div>

              {/* Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-5"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                  Operational Impact Leaderboard
                </h3>
                <p className="text-[10px] mb-5" style={{ color: 'var(--muted-fg)' }}>
                  Individual automations ranked by time savings magnitude during the selected period.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th className="py-2 text-[10px] font-semibold" style={{ color: 'var(--muted-fg)' }}>Rank</th>
                        <th className="py-2 text-[10px] font-semibold" style={{ color: 'var(--muted-fg)' }}>Automation Name</th>
                        <th className="py-2 text-[10px] font-semibold" style={{ color: 'var(--muted-fg)' }}>Program</th>
                        <th className="py-2 text-[10px] font-semibold text-center" style={{ color: 'var(--muted-fg)' }}>Standard Setup</th>
                        <th className="py-2 text-[10px] font-semibold text-right" style={{ color: 'var(--muted-fg)' }}>Period Reclaimed Hours</th>
                        <th className="py-2 text-[10px] font-semibold text-right text-emerald-400" style={{ color: 'var(--success)' }}>Period Reclaimed Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodLeaderboard.map((auto, rank) => (
                        <tr key={auto.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td className="py-3 font-bold" style={{ color: rank === 0 ? '#f59e0b' : 'var(--muted-fg)' }}>
                            #{rank + 1}
                          </td>
                          <td className="py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                            {auto.name}
                          </td>
                          <td className="py-3">
                            {(() => {
                              const colors = getProgramColors(auto.program, theme === 'dark');
                              return (
                                <span
                                  className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-lg transition-all duration-300"
                                  style={{
                                    background: colors.bg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                    boxShadow: colors.glow,
                                    textShadow: theme === 'dark' ? `0 0 8px ${colors.text}25` : 'none',
                                  }}
                                >
                                  {auto.program}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-3 text-center" style={{ color: 'var(--muted-fg)' }}>
                            {auto.time_saved_per_run > 0
                              ? `${auto.time_saved_per_run} mins saved in one-time operation (runs ${auto.frequency_per_week || 1} times/week)`
                              : `${auto.time_saved_per_day} mins saved per day`}
                          </td>
                          <td className="py-3 text-right font-semibold" style={{ color: 'var(--foreground)' }}>
                            {auto.hours} hrs
                          </td>
                          <td className="py-3 text-right font-bold text-emerald-400">
                            {auto.days} days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
