'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Moon, Sun, Camera, Trash2, ZoomIn, Upload, X, Plus, Minus, Check, RotateCw, Eye, EyeOff, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [srcImage, setSrcImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
 
  // Change Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      if (isSupabaseConfigured()) {
        // 1. Update password in Supabase Auth
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setPasswordError(error.message);
          setPasswordLoading(false);
          return;
        }

        // 2. Update current_password field in custom profiles table
        await supabase
          .from('profiles')
          .update({ current_password: newPassword })
          .eq('id', profile.id);

        // 3. Add to password history logs (fails gracefully if table is not created yet)
        // NOTE: Supabase client returns errors as { error } objects, not thrown exceptions,
        //       so we check the returned error rather than relying on try/catch.
        const { error: historyErr } = await supabase
          .from('password_history')
          .insert({
            profile_id: profile.id,
            user_email: profile.email,
            password: newPassword,
            changed_by: 'user'
          });
        if (historyErr) {
          console.warn('Could not log password to history (run migration if needed):', historyErr.message);
        }

        // 4. Log to standard Activity Logs table
        await supabase.from('activity_logs').insert({
          user_email: profile.email,
          automation_name: 'Changed Password',
          program_name: 'Security Settings',
          clicked_at: new Date().toISOString()
        });
      } else {
        localStorage.setItem(`upgrad_password_demo`, newPassword);
      }
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    }
    setPasswordLoading(false);
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

  const handleRemovePhoto = async () => {
    if (profile?.email) {
      localStorage.removeItem(`upgrad_avatar_${profile.email}`);
      if (isSupabaseConfigured()) {
        try {
          // 1. Sync to Auth metadata (always works)
          await supabase.auth.updateUser({
            data: { avatar_url: null }
          });
          // 2. Try to sync to custom profiles table (gracefully fails if column is missing)
          await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', profile.id);
        } catch (err) {
          console.error('Error removing profile picture from Supabase:', err);
        }
      }
      await refreshProfile();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mr-auto px-4 md:px-6 py-6 md:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <SettingsIcon size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Settings
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Manage your preferences and account settings.
            </p>
          </motion.div>

          <div className="space-y-4">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <User size={16} style={{ color: 'var(--muted-fg)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Profile Settings
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 mb-5 pb-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                {/* Profile Photo Square */}
                <div className="relative group w-20 h-20 rounded-2xl border overflow-hidden cursor-pointer flex-shrink-0"
                     style={{ borderColor: 'var(--border-color)', background: 'var(--surface)' }}
                     onClick={() => fileInputRef.current?.click()}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-200" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl" style={{ color: 'var(--foreground)' }}>
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  {/* Hover Edit Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-0.5 transition-opacity duration-200 text-white select-none">
                    <Camera size={14} />
                    <span className="text-[7.5px] font-bold uppercase tracking-wider">
                      {profile?.avatar_url ? 'Change' : 'Upload'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center sm:items-start gap-2">
                  <div>
                    <h3 className="text-[13px] font-semibold text-center sm:text-left" style={{ color: 'var(--foreground)' }}>
                      {profile?.name || 'User'}
                    </h3>
                    <p className="text-[11px] text-center sm:text-left" style={{ color: 'var(--muted-fg)' }}>
                      {profile?.email || 'Not set'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-surface border transition-all"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--foreground)', background: 'transparent' }}
                    >
                      Upload Photo
                    </button>
                    {profile?.avatar_url && (
                      <button 
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-red-500/10 border transition-all"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', background: 'transparent' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Name</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                    {profile?.name || 'Not set'}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between py-1"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Email</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                    {profile?.email || 'Not set'}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between py-1"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Role</span>
                  <span
                    className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {profile?.role?.replace('_', ' ') || 'user'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Theme Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon size={16} style={{ color: 'var(--muted-fg)' }} />
                  ) : (
                    <Sun size={16} style={{ color: 'var(--muted-fg)' }} />
                  )}
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Appearance
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={toggleTheme}
                  className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border-color)',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </motion.button>
              </div>
            </motion.div>

            {/* Change Password Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <SettingsIcon size={16} style={{ color: 'var(--muted-fg)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Security & Password
                </h2>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px]" style={{ color: 'var(--muted-fg)' }}>New Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--foreground)',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 p-1 rounded-lg text-zinc-400 hover:text-zinc-200 focus:outline-none cursor-pointer"
                        style={{ background: 'transparent', border: 'none' }}
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px]" style={{ color: 'var(--muted-fg)' }}>Confirm Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        placeholder="Match new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--foreground)',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 p-1 rounded-lg text-zinc-400 hover:text-zinc-200 focus:outline-none cursor-pointer"
                        style={{ background: 'transparent', border: 'none' }}
                      >
                        {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-xs font-medium text-emerald-500">{passwordSuccess}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2"
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: '1px solid var(--accent)',
                  }}
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px var(--glow-color)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {passwordLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                  Update Password
                </motion.button>
              </form>
            </motion.div>

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                About
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--muted-fg)' }}>Version</span>
                  <span style={{ color: 'var(--foreground)' }}>1.0.0</span>
                </div>
                <div className="flex justify-between text-xs" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span style={{ color: 'var(--muted-fg)' }}>Platform</span>
                  <span style={{ color: 'var(--foreground)' }}>upGrad Automation Portal</span>
                </div>
              </div>
            </motion.div>
          </div>
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
    </div>
  );
}
