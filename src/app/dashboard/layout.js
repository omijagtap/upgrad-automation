'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setChecking(false);
      }
    }
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: 'var(--accent)' }}
          />
          <span className="text-sm" style={{ color: 'var(--muted-fg)' }}>
            Loading…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none z-0" />

      <Sidebar />

      <main className="flex-1 relative z-10 min-w-0">
        {children}
      </main>
    </div>
  );
}
