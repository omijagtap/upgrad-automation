'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none z-0" />

      <Sidebar />

      <main className="flex-1 relative z-10 min-w-0 h-full flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
