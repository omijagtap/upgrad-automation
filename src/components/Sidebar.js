'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Layers,
  Star,
  Clock,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase';

const menuItems = [
  { name: 'Home', icon: Home, path: '/dashboard' },
  { name: 'Programs', icon: Layers, path: '/dashboard/programs' },
  { name: 'Favorites', icon: Star, path: '/dashboard/favorites' },
  { name: 'Recent Tools', icon: Clock, path: '/dashboard/recent' },
  { name: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
  { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
];

const adminItems = [
  { name: 'Authority', icon: Shield, path: '/dashboard/authority' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasAdminAccess, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Force expansion on mobile devices so links and Logout are fully visible and clickable
  const showExpanded = !collapsed || mobileOpen;

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const NavLink = ({ item }) => {
    const isActive = pathname === item.path;
    return (
      <Link href={item.path} onClick={() => setMobileOpen(false)}>
        <motion.div
          className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 group"
          style={{
            background: isActive ? 'var(--surface)' : 'transparent',
            color: isActive ? 'var(--foreground)' : 'var(--muted-fg)',
            border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
          }}
          whileHover={{
            color: 'var(--foreground)',
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
              style={{ background: 'var(--accent)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <item.icon className="w-[0.9375rem] h-[0.9375rem] flex-shrink-0" />
          <AnimatePresence>
            {showExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[0.8125rem] font-medium whitespace-nowrap overflow-hidden"
              >
                {item.name}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3.5 h-[52px] border-b" style={{ borderColor: 'var(--border-color)' }}>
        <AnimatePresence>
          {showExpanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-baseline gap-0"
            >
              <span className="text-[0.9375rem] font-bold logo-shimmer tracking-tight">upGrad</span>
              <span className="text-[0.6875rem] font-light ml-1" style={{ color: 'var(--muted-fg)' }}>
                Automation
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[0.9375rem] font-bold logo-shimmer"
            >
              uG
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {menuItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}

        {/* Admin Section */}
        {hasAdminAccess && (
          <>
            <div className="pt-4 pb-2">
              {showExpanded && (
                <span className="px-2.5 text-[0.625rem] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-fg)' }}>
                  Admin
                </span>
              )}
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </>
        )}
      </div>

      {/* Bottom Section */}
      <div className="px-2.5 py-2.5 border-t space-y-1.5" style={{ borderColor: 'var(--border-color)' }}>
        {/* User info */}
        {showExpanded && profile && (
          <div className="px-2.5 py-1.5">
            <p className="text-[0.6875rem] font-medium truncate" style={{ color: 'var(--foreground)' }}>
              {profile.name || 'User'}
            </p>
            <p className="text-[0.625rem] truncate" style={{ color: 'var(--muted-fg)' }}>
              {profile.role?.replace('_', '-') || 'user'}
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200"
          style={{ color: 'var(--muted-fg)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--muted-fg)';
          }}
        >
          <LogOut className="w-[0.9375rem] h-[0.9375rem] flex-shrink-0" />
          {showExpanded && <span className="text-[0.8125rem] font-medium">Logout</span>}
        </button>


        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-full py-2 rounded-xl cursor-pointer transition-all duration-200"
          style={{ color: 'var(--muted-fg)', background: 'var(--surface)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 flex-shrink-0" /> : <ChevronLeft className="w-4 h-4 flex-shrink-0" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-xl cursor-pointer"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          color: 'var(--foreground)',
        }}
      >
        <Menu className="w-4.5 h-4.5 flex-shrink-0" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-17.5rem' }}
            animate={{ x: 0 }}
            exit={{ x: '-17.5rem' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[16.25rem] md:hidden"
            style={{
              background: 'var(--sidebar-bg)',
              borderRight: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg cursor-pointer"
              style={{ color: 'var(--muted-fg)' }}
            >
              <X className="w-4 h-4 flex-shrink-0" />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? '3.5rem' : '11.5rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0"
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
