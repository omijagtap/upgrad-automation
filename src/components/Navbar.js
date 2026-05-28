'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, LogOut, Settings, Camera, ZoomIn, Plus, Minus, Check, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { signOut, supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Navbar({ searchQuery, onSearchChange }) {
  const [focused, setFocused] = useState(false);
  const { profile, refreshProfile } = useAuth();
  const { theme } = useTheme();

  // Profile Dropdown States
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // WhatsApp Crop Modal States
  const [srcImage, setSrcImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSrcImage(reader.result);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCropModalOpen(true);
      setDropdownOpen(false); // Close dropdown when modal opens
    };
    reader.readAsDataURL(file);
  };

  const handleStartDrag = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = () => {
    const img = new Image();
    img.src = srcImage;
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      ctx.save();
      // Translate to center of canvas (100, 100)
      ctx.translate(100 + offset.x, 100 + offset.y);
      ctx.scale(zoom, zoom);

      // Maintain aspect ratio
      let dw, dh;
      const ratio = img.width / img.height;
      if (ratio > 1) {
        dh = 200;
        dw = 200 * ratio;
      } else {
        dw = 200;
        dh = 200 / ratio;
      }

      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      if (profile?.email) {
        localStorage.setItem(`upgrad_avatar_${profile.email}`, croppedBase64);
        if (isSupabaseConfigured()) {
          try {
            // 1. Sync to Auth metadata (always works)
            await supabase.auth.updateUser({
              data: { avatar_url: croppedBase64 }
            });
            // 2. Try to sync to custom profiles table (gracefully fails if column is missing)
            await supabase
              .from('profiles')
              .update({ avatar_url: croppedBase64 })
              .eq('id', profile.id);
          } catch (err) {
            console.error('Error syncing profile picture to Supabase:', err);
          }
        }
        await refreshProfile();
      }
      setCropModalOpen(false);
      setSrcImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-40 glass-strong"
      style={{
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between h-[52px] pl-[52px] pr-4 md:px-6">
        {/* Breadcrumb Info (Left) */}
        <div className="flex items-center gap-1.5 text-[12.8px] font-medium tracking-tight select-none">
          <span className="hidden sm:inline" style={{ color: 'var(--muted-fg)' }}>Dashboard</span>
          <span className="hidden sm:inline" style={{ color: 'var(--border-color)', opacity: 0.6 }}>/</span>
          <span style={{ color: 'var(--foreground)' }}>Automations</span>
        </div>

        {/* Right Section (Search bar + Toggle + Profile Avatar Menu) */}
        <div className="flex items-center gap-2 xs:gap-3">
          {/* Search Input Box */}
          <div
            className="relative flex items-center transition-all duration-300 rounded-xl h-[32px] w-[102px] xs:w-[136px] sm:w-[187px] md:w-[272px]"
            style={{
              background: 'var(--input-bg)',
              border: focused ? '1px solid var(--accent)' : '1px solid var(--border-color)',
              boxShadow: focused ? '0 0 20px var(--glow-color)' : 'none',
            }}
          >
            <Search
              size={12}
              className="absolute left-2 pointer-events-none"
              style={{ color: 'var(--muted-fg)' }}
            />
            <input
              type="text"
              placeholder="Search automations, categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full h-full py-0 pl-7 pr-10 text-[10.7px] bg-transparent border-0 rounded-xl focus:ring-0"
              style={{
                color: 'var(--foreground)',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
            
            {/* Shortcut key or Clear search */}
            <div className="absolute right-2 flex items-center pointer-events-none">
              <AnimatePresence mode="wait">
                {searchQuery ? (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange('');
                    }}
                    className="pointer-events-auto p-0.5 rounded-md hover:bg-white/10"
                    style={{ color: 'var(--muted-fg)' }}
                  >
                    <X size={13} />
                  </motion.button>
                ) : (
                  <motion.span
                    key="shortcut"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[8px] px-1 py-0.5 rounded border font-mono tracking-widest leading-none select-none opacity-55"
                    style={{
                      borderColor: 'var(--border-color)',
                      background: 'var(--surface)',
                      color: 'var(--muted-fg)',
                    }}
                  >
                    ⌘K
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Role badge — always visible in navbar */}
          {profile && (
            <span
              className="hidden sm:inline-block text-[9px] font-semibold px-2 py-0.5 rounded-lg tracking-wide select-none flex-shrink-0"
              style={{
                background: profile.role === 'admin'
                  ? 'rgba(242, 62, 54, 0.12)'
                  : profile.role === 'co_admin'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(100, 100, 120, 0.12)',
                color: profile.role === 'admin'
                  ? '#F23E36'
                  : profile.role === 'co_admin'
                  ? '#f59e0b'
                  : 'var(--muted-fg)',
                border: `1px solid ${profile.role === 'admin'
                  ? 'rgba(242, 62, 54, 0.25)'
                  : profile.role === 'co_admin'
                  ? 'rgba(245, 158, 11, 0.25)'
                  : 'var(--border-color)'}`,
              }}
            >
              {profile.role === 'admin' ? 'Admin' : profile.role === 'co_admin' ? 'Co-Admin' : 'User'}
            </span>
          )}

          {/* Top-Right Profile Dropdown Menu */}
          {profile && (
            <div 
              className="relative py-1" 
              ref={dropdownRef}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <motion.button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-[31px] h-[31px] rounded-xl border flex items-center justify-center font-extrabold text-[12px] overflow-hidden cursor-pointer flex-shrink-0 transition-transform active:scale-95"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--foreground)'
                }}
                whileHover={{ scale: 1.05, borderColor: 'var(--border-hover)' }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
                )}
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full pt-1.5 w-56 z-50"
                  >
                    <div
                      className="rounded-2xl border p-2 shadow-2xl backdrop-blur-md"
                      style={{
                        background: theme === 'dark' ? 'rgba(20, 20, 25, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'var(--border-color)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      {/* User Summary Header */}
                      <div className="px-3 py-2.5 flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-lg border flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0"
                             style={{
                               background: 'var(--surface)',
                               borderColor: 'var(--border-color)',
                               color: 'var(--foreground)'
                             }}>
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>
                            {profile.name || 'User'}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--muted-fg)' }}>
                            {profile.email}
                          </p>
                          {/* Role badge */}
                          <span
                            className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md tracking-wide"
                            style={{
                              background: profile.role === 'admin'
                                ? 'rgba(242, 62, 54, 0.15)'
                                : profile.role === 'co_admin'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(100, 100, 120, 0.15)',
                              color: profile.role === 'admin'
                                ? '#F23E36'
                                : profile.role === 'co_admin'
                                ? '#f59e0b'
                                : 'var(--muted-fg)',
                              border: `1px solid ${profile.role === 'admin'
                                ? 'rgba(242, 62, 54, 0.3)'
                                : profile.role === 'co_admin'
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'var(--border-color)'}`,
                            }}
                          >
                            {profile.role === 'admin' ? 'Admin' : profile.role === 'co_admin' ? 'Co-Admin' : 'User'}
                          </span>
                        </div>
                      </div>

                      <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />

                      {/* Menu items */}
                      <div className="space-y-0.5">
                        {/* Upload photo inside dropdown */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs cursor-pointer transition-colors"
                          style={{ color: 'var(--foreground)', background: 'transparent', border: 'none' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Camera size={14} style={{ color: 'var(--muted-fg)' }} />
                          <span>Upload Photo</span>
                        </button>

                        {/* Settings */}
                        <Link href="/dashboard/settings" onClick={() => setDropdownOpen(false)}>
                          <div
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs cursor-pointer transition-colors"
                            style={{ color: 'var(--foreground)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Settings size={14} style={{ color: 'var(--muted-fg)' }} />
                            <span>Settings</span>
                          </div>
                        </Link>

                        <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs cursor-pointer transition-colors"
                          style={{ color: 'var(--foreground)', background: 'transparent', border: 'none' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface)';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--foreground)';
                          }}
                        >
                          <LogOut size={14} className="text-red-500" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Custom Theme-Aligned Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[380px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col backdrop-blur-xl"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--foreground)'
            }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--surface)' }}>
              <div className="flex items-center">
                <button 
                  onClick={() => { setCropModalOpen(false); setSrcImage(null); }}
                  className="p-1 rounded-lg hover:bg-surface text-muted-fg hover:text-foreground cursor-pointer transition-colors border-0"
                  style={{ background: 'transparent' }}
                >
                  <X size={18} />
                </button>
                <span className="ml-3 text-[13.5px] font-medium tracking-wide">Drag the image to adjust</span>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-accent hover:bg-surface border transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border-color)', background: 'transparent', color: 'var(--accent)' }}
              >
                <RotateCw size={13} />
                <span>Upload</span>
              </button>
            </div>

            {/* Editor body (Left crop box, right zoom & save controls) */}
            <div className="flex items-center justify-center gap-5 p-5">
              {/* Left Column: Crop Window */}
              <div 
                className="relative w-[260px] h-[260px] rounded-xl border overflow-hidden cursor-move select-none"
                style={{
                  background: '#070a0c',
                  borderColor: 'var(--border-color)',
                }}
                onMouseDown={handleStartDrag}
                onMouseMove={handleDrag}
                onMouseUp={handleEndDrag}
                onMouseLeave={handleEndDrag}
                onTouchStart={handleStartDrag}
                onTouchMove={handleDrag}
                onTouchEnd={handleEndDrag}
              >
                {/* Render Image behind mask */}
                {srcImage && (
                  <img
                    src={srcImage}
                    alt="To Crop"
                    draggable={false}
                    className="absolute origin-center pointer-events-none select-none max-w-none max-h-none"
                    style={{
                      transform: `translate(calc(130px - 50% + ${offset.x}px), calc(130px - 50% + ${offset.y}px)) scale(${zoom})`,
                      width: '180px',
                      height: 'auto',
                      top: 0,
                      left: 0,
                    }}
                  />
                )}

                {/* Rounded Square Cutout Overlay Mask */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[180px] h-[180px] rounded-2xl border border-dashed border-white/30" 
                       style={{
                         boxShadow: '0 0 0 9999px rgba(10, 10, 12, 0.8)'
                       }}
                  />
                </div>
              </div>

              {/* Right Column: Zoom & Save Controls */}
              <div className="flex flex-col items-center justify-between h-[260px] py-2">
                {/* Vertical Zoom column */}
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                    className="p-1.5 rounded-lg hover:bg-surface text-muted-fg hover:text-foreground transition-colors cursor-pointer border-0"
                    style={{ background: 'transparent' }}
                    title="Zoom In"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                  <input 
                    type="range"
                    min="1"
                    max="3"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-3 h-24 cursor-pointer accent-accent"
                    style={{
                      WebkitAppearance: 'slider-vertical',
                      accentColor: 'var(--accent)',
                    }}
                  />
                  <button 
                    onClick={() => setZoom(prev => Math.max(1, prev - 0.1))}
                    className="p-1.5 rounded-lg hover:bg-surface text-muted-fg hover:text-foreground transition-colors cursor-pointer border-0"
                    style={{ background: 'transparent' }}
                    title="Zoom Out"
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Circular Confirm Save button styled with brand red */}
                <button
                  onClick={handleSaveCrop}
                  className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer border-0"
                  style={{ 
                    background: 'var(--accent)',
                    boxShadow: '0 4px 15px rgba(242, 62, 54, 0.4)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover, var(--accent))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
                  title="Save Profile Photo"
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.nav>
  );
}
