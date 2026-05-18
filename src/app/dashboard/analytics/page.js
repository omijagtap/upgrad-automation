'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Sparkles, AlertCircle, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAutomations } from '@/hooks/useAutomations';

export default function AnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { automations, loading } = useAutomations();

  // Filter automations that are enabled
  const activeAutos = useMemo(() => {
    return automations.filter(a => a.enabled !== false);
  }, [automations]);

  // Telemetry Metrics calculations
  const metrics = useMemo(() => {
    // Total weekly minutes saved is the sum of (frequency_per_week * time_saved_per_run)
    const totalMinutesPerWeek = activeAutos.reduce((sum, a) => {
      if (a.time_saved_per_run > 0) {
        return sum + (Number(a.time_saved_per_run) * Number(a.frequency_per_week || 1));
      }
      return sum + (Number(a.time_saved_per_day || 0) * 5);
    }, 0);

    const totalHoursPerWeek = totalMinutesPerWeek / 60;
    const totalHoursPerDay = totalHoursPerWeek / 5; // 5 working days/week
    const totalMinutesPerDay = totalHoursPerDay * 60;
    const totalHoursPerMonth = totalHoursPerWeek * 4.33; // average weeks per month
    const totalHoursPerYear = totalHoursPerWeek * 52; // 52 weeks per year
    
    // Equivalent in full working days (8 hours = 1 workday)
    const workdaysSavedPerYear = totalHoursPerYear / 8;

    return {
      minutesPerDay: Math.round(totalMinutesPerDay),
      hoursPerDay: totalHoursPerDay.toFixed(1),
      hoursPerWeek: totalHoursPerWeek.toFixed(1),
      hoursPerMonth: totalHoursPerMonth.toFixed(0),
      workdaysSavedPerYear: workdaysSavedPerYear.toFixed(1),
    };
  }, [activeAutos]);

  // Breakdown by program category
  const programBreakdown = useMemo(() => {
    const categories = {};
    activeAutos.forEach(a => {
      const weeklyMinutes = a.time_saved_per_run > 0
        ? Number(a.time_saved_per_run) * Number(a.frequency_per_week || 1)
        : (Number(a.time_saved_per_day || 0) * 5);
      categories[a.program] = (categories[a.program] || 0) + weeklyMinutes;
    });

    const totalMinutes = Object.values(categories).reduce((sum, t) => sum + t, 0);

    return Object.entries(categories)
      .map(([name, minutes]) => ({
        name,
        minutes,
        hours: (minutes / 60).toFixed(1),
        percentage: totalMinutes > 0 ? ((minutes / totalMinutes) * 100).toFixed(0) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [activeAutos]);

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mr-auto px-4 md:px-6 py-6 md:py-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'rgba(236, 72, 153, 0.08)',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                }}
              >
                <BarChart3 size={18} style={{ color: '#ec4899' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Efficiency Analytics
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Real-time calculations of team hours saved through operational automations.
            </p>
          </motion.div>

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
                Create custom automation cards with "Time Saved" data in the Authority Panel to populate operational savings charts.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
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
                      Daily Time Savings
                    </span>
                    <Clock size={16} className="text-pink-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                      {metrics.minutesPerDay}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>mins/day</span>
                  </div>
                  <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
                    Total active time reclaimed across {activeAutos.length} operational processes.
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
                    Frees up team capacity for strategic learner audits.
                  </p>
                </motion.div>

                {/* Metric 4 */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
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
                
                {/* Left: Program Breakdown */}
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
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

                  <div className="space-y-4 flex-1">
                    {programBreakdown.map((prog, idx) => (
                      <div key={prog.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span style={{ color: 'var(--foreground)' }}>{prog.name}</span>
                          <span style={{ color: 'var(--muted-fg)' }}>{prog.hours} hrs/day ({prog.percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${prog.percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.1 * idx }}
                            className="h-full rounded-full"
                            style={{
                              background: idx % 3 === 0
                                ? 'linear-gradient(90deg, #ec4899, #f43f5e)'
                                : idx % 3 === 1
                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                : 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
                              boxShadow: '0 0 8px rgba(236,72,153,0.3)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Right: Individual Automation Rank */}
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2 rounded-2xl p-5"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    Operational Impact Leaderboard
                  </h3>
                  <p className="text-[10px] mb-5" style={{ color: 'var(--muted-fg)' }}>
                    Individual automations ranked by time savings magnitude.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <th className="py-2 text-[10px] font-semibold" style={{ color: 'var(--muted-fg)' }}>Rank</th>
                          <th className="py-2 text-[10px] font-semibold" style={{ color: 'var(--muted-fg)' }}>Automation Name</th>
                          <th className="py-2 text-[10px] font-semibold" style={{ color: 'var(--muted-fg)' }}>Program</th>
                          <th className="py-2 text-[10px] font-semibold text-right" style={{ color: 'var(--muted-fg)' }}>Savings Profile</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAutos
                          .sort((a, b) => {
                            const valA = a.time_saved_per_run > 0 ? Number(a.time_saved_per_run) : Number(a.time_saved_per_day || 0);
                            const valB = b.time_saved_per_run > 0 ? Number(b.time_saved_per_run) : Number(b.time_saved_per_day || 0);
                            return valB - valA;
                          })
                          .map((auto, rank) => (
                            <tr key={auto.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td className="py-2.5 font-bold" style={{ color: rank === 0 ? '#f59e0b' : 'var(--muted-fg)' }}>
                                #{rank + 1}
                              </td>
                              <td className="py-2.5 font-medium" style={{ color: 'var(--foreground)' }}>
                                {auto.name}
                              </td>
                              <td className="py-2.5">
                                <span
                                  className="px-2 py-0.5 text-[9px] font-medium rounded-lg"
                                  style={{
                                    background: 'var(--surface)',
                                    color: 'var(--muted-fg)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  {auto.program}
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-semibold text-emerald-500">
                                {auto.time_saved_per_run > 0
                                  ? `${auto.time_saved_per_run}m saved (${auto.frequency_per_week || 1}x/wk)`
                                  : `${auto.time_saved_per_day}m/day`}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
