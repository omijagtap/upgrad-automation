'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signIn, isSupabaseConfigured, getUserProfile, signOut, logActivity } from '@/lib/supabase';
import { Eye, EyeOff, ArrowRight, Loader2, Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Auto redirect to dashboard in demo mode
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Small delay for page transition feel
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured()) {
      router.push('/dashboard');
      return;
    }

    try {
      const { data, error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if user account is deactivated
      if (data?.user) {
        const { data: profileData } = await getUserProfile(data.user.id);
        if (profileData && profileData.active === false) {
          await signOut(); // Log them out immediately
          setError('Your account has been deactivated. Please contact your Admin.');
          setLoading(false);
          return;
        }

        // Log successful login activity
        await logActivity(email, 'User Logged In', 'Login Portal');
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            <span className="logo-shimmer">upGrad</span>
            <span className="font-light ml-1.5" style={{ color: 'var(--muted-fg)' }}>
              Automation
            </span>
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
            Sign in to your automation portal
          </p>
        </motion.div>

        {/* Demo mode notice */}
        {!isSupabaseConfigured() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{
              background: 'rgba(255, 51, 102, 0.08)',
              border: '1px solid rgba(255, 51, 102, 0.15)',
              color: 'var(--accent)',
            }}
          >
            <Info size={14} />
            <span>Demo mode — Supabase not configured. Redirecting to dashboard…</span>
          </motion.div>
        )}

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
          style={{
            boxShadow: '0 8px 40px var(--shadow-color)',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-fg)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required={isSupabaseConfigured()}
                className="w-full px-3.5 py-2.5 text-[16px] md:text-sm rounded-xl transition-all duration-200"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-fg)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required={isSupabaseConfigured()}
                  className="w-full px-3.5 py-2.5 pr-10 text-[16px] md:text-sm rounded-xl transition-all duration-200"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--muted-fg)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 btn-press cursor-pointer"
              style={{
                background: 'var(--accent)',
                color: '#ffffff',
                border: '1px solid var(--accent)',
                opacity: loading ? 0.7 : 1,
              }}
              whileHover={{ boxShadow: '0 0 25px var(--glow-color)', scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={14} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[10px] mt-6"
          style={{ color: 'var(--muted-fg)' }}
        >
          Internal use only • upGrad Education Pvt. Ltd.
        </motion.p>
      </motion.div>
    </div>
  );
}
