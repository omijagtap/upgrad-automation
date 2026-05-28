'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Zap,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  X,
  Loader2,
  Edit,
  Check,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Copy,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  getAllProfiles,
  updateProfile,
  deleteProfile,
  getActivityLogs,
  supabase,
} from '@/lib/supabase';
import { useAutomations } from '@/hooks/useAutomations';
import { useTheme } from '@/hooks/useTheme';
import { getProgramColors } from '@/lib/colors';

export default function AuthorityPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin, isCoAdmin, hasAdminAccess, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('automations');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ email: '', password: '', name: '', role: 'user' });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // User Password Details Modal States
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [passwordHistory, setPasswordHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDetailsPassword, setShowDetailsPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectUser = async (u) => {
    setSelectedUserForDetails(u);
    setShowDetailsPassword(false);
    setCopied(false);
    setPasswordHistory([]);
    setLoadingHistory(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('password_history')
          .select('*')
          .eq('profile_id', u.id)
          .order('changed_at', { ascending: false });
        if (error) {
          console.warn('Could not query password_history table. Ensure migration has been run.', error);
        } else if (data) {
          setPasswordHistory(data);
        }
      }
    } catch (err) {
      console.warn('Error fetching password history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopyPassword = (pwd) => {
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic Automation Hook and States
  const {
    automations: allAutos,
    addAutomation,
    updateAutomation,
    deleteAutomation,
    loading: autosLoading
  } = useAutomations();

  // Extract unique program categories from existing database cards dynamically for suggestions
  const existingCategories = useMemo(() => {
    const cats = new Set();
    if (allAutos && Array.isArray(allAutos)) {
      allAutos.forEach(a => {
        if (a.program && a.program.trim()) {
          cats.add(a.program.trim());
        }
      });
    }
    return Array.from(cats).sort();
  }, [allAutos]);

  const [showAddAuto, setShowAddAuto] = useState(false);
  const [addAutoForm, setAddAutoForm] = useState({
    name: '',
    description: '',
    program: 'MBA',
    link: '',
    icon: 'GraduationCap',
    status: 'live',
    enabled: true,
    time_saved_per_day: 0,
    frequency_per_week: 1,
    time_saved_per_run: 0
  });
  const [addAutoLoading, setAddAutoLoading] = useState(false);
  const [addAutoError, setAddAutoError] = useState('');
  const [confirmDeleteAuto, setConfirmDeleteAuto] = useState(null);

  // Edit card states
  const [editingAuto, setEditingAuto] = useState(null);
  const [editAutoForm, setEditAutoForm] = useState({
    name: '',
    description: '',
    program: '',
    link: '',
    status: 'live',
    enabled: true,
    time_saved_per_day: 0,
    frequency_per_week: 1,
    time_saved_per_run: 0
  });
  const [editAutoLoading, setEditAutoLoading] = useState(false);
  const [editAutoError, setEditAutoError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, logsRes] = await Promise.all([
      getAllProfiles(),
      getActivityLogs(250),
    ]);
    if (profilesRes.data) setUsers(profilesRes.data);
    if (logsRes.data) setLogs(logsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasAdminAccess) fetchData();
  }, [hasAdminAccess, fetchData]);

  // Filtered lists based on searchQuery
  const filteredAutomations = useMemo(() => {
    if (!searchQuery.trim()) return allAutos;
    const q = searchQuery.toLowerCase();
    return allAutos.filter(
      (auto) =>
        (auto.name || '').toLowerCase().includes(q) ||
        (auto.program || '').toLowerCase().includes(q) ||
        (auto.description || '').toLowerCase().includes(q)
    );
  }, [allAutos, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(log => {
      const matchedUser = users.find(u => u.email?.toLowerCase() === log.user_email?.toLowerCase());
      const displayName = matchedUser?.name || '';
      return (
        (log.user_email || '').toLowerCase().includes(q) ||
        displayName.toLowerCase().includes(q) ||
        (log.automation_name || '').toLowerCase().includes(q) ||
        (log.program_name || '').toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, users]);

  // Reset page number on search or tab change
  useEffect(() => {
    setLogsPage(1);
  }, [searchQuery, activeTab]);

  const totalLogsPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;

  const paginatedLogs = useMemo(() => {
    const startIndex = (logsPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, logsPage, logsPerPage]);

  // Toggle automation enabled/disabled
  const toggleAutomation = async (id, currentEnabled) => {
    await updateAutomation(id, { enabled: !currentEnabled });
  };

  // Change automation status
  const changeAutomationStatus = async (id, status) => {
    await updateAutomation(id, { status, enabled: status === 'live' });
  };

  // Handle create automation card
  const handleCreateAutomation = async (e) => {
    e.preventDefault();
    setAddAutoLoading(true);
    setAddAutoError('');

    try {
      const payload = {
        ...addAutoForm,
        time_saved_per_day: Math.round((Number(addAutoForm.time_saved_per_run || 0) * Number(addAutoForm.frequency_per_week || 1)) / 5)
      };
      const { error } = await addAutomation(payload);
      if (error) {
        setAddAutoError(error);
      } else {
        setShowAddAuto(false);
        setAddAutoForm({
          name: '',
          description: '',
          program: 'MBA',
          link: '',
          icon: 'GraduationCap',
          status: 'live',
          enabled: true,
          time_saved_per_day: 0,
          frequency_per_week: 1,
          time_saved_per_run: 0
        });
      }
    } catch (err) {
      setAddAutoError('Failed to create automation card');
    }
    setAddAutoLoading(false);
  };

  // Handle start editing automation card
  const handleStartEdit = (auto) => {
    setEditingAuto(auto);
    setEditAutoForm({
      name: auto.name || '',
      description: auto.description || '',
      program: auto.program || '',
      link: auto.link || '',
      status: auto.status || 'live',
      enabled: auto.enabled !== undefined ? auto.enabled : true,
      time_saved_per_day: auto.time_saved_per_day !== undefined ? auto.time_saved_per_day : 0,
      frequency_per_week: auto.frequency_per_week !== undefined ? auto.frequency_per_week : 1,
      time_saved_per_run: auto.time_saved_per_run !== undefined ? auto.time_saved_per_run : 0
    });
    setEditAutoError('');
    setShowAddAuto(false); // Close add form if open

    // Scroll smoothly to top of the card builder container
    const container = document.getElementById('custom-card-builder-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle save editing changes
  const handleUpdateAutomation = async (e) => {
    e.preventDefault();
    setEditAutoLoading(true);
    setEditAutoError('');

    try {
      const payload = {
        ...editAutoForm,
        time_saved_per_day: Math.round((Number(editAutoForm.time_saved_per_run || 0) * Number(editAutoForm.frequency_per_week || 1)) / 5)
      };
      const { error } = await updateAutomation(editingAuto.id, payload);
      if (error) {
        setEditAutoError(error);
      } else {
        setEditingAuto(null);
      }
    } catch (err) {
      setEditAutoError('Failed to update automation card');
    }
    setEditAutoLoading(false);
  };

  // Handle delete dynamic automation
  const handleDeleteAuto = async (id) => {
    await deleteAutomation(id);
    setConfirmDeleteAuto(null);
  };

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    // Co-admin can't change admin roles
    if (isCoAdmin && (newRole === 'admin' || newRole === 'co_admin')) return;
    await updateProfile(userId, { role: newRole });
    fetchData();
  };

  // Toggle user active
  const handleToggleActive = async (userId, currentActive) => {
    await updateProfile(userId, { active: !currentActive });
    fetchData();
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    await deleteProfile(userId);
    setConfirmDelete(null);
    fetchData();
  };

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError('');

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: addUserForm.email,
          password: addUserForm.password,
          name: addUserForm.name,
          role: addUserForm.role,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setAddUserError(result.error || 'Failed to create user');
      } else {
        setShowAddUser(false);
        setAddUserForm({ email: '', password: '', name: '', role: 'user' });
        setShowPassword(false);
        fetchData();
      }
    } catch (err) {
      setAddUserError('Failed to create user');
    }
    setAddUserLoading(false);
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex flex-col h-full">
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield size={48} style={{ color: 'var(--muted-fg)' }} className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              Access Denied
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'activity', label: 'Activity Logs', icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-8xl mr-auto px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <Shield size={18} style={{ color: '#ef4444' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Authority Panel
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Manage automations, users, and access controls.
              {isCoAdmin && ' (Co-Admin access — limited permissions)'}
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: activeTab === tab.id ? 'var(--accent)' : 'var(--surface)',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--muted-fg)',
                  border: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <tab.icon size={14} />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* AUTOMATIONS TAB */}
          {activeTab === 'automations' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Add Automation Button */}
              {isAdmin && (
                <div className="mb-4">
                  <motion.button
                    onClick={() => setShowAddAuto(!showAddAuto)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all duration-200"
                    style={{
                      background: 'var(--accent)',
                      color: '#ffffff',
                      border: '1px solid var(--accent)',
                    }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 15px var(--glow-color)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Plus size={14} />
                    Add Custom Automation
                  </motion.button>
                </div>
              )}

              {/* Add/Edit Automation Form Container */}
              <div id="custom-card-builder-container">
                <AnimatePresence>
                  {(showAddAuto || editingAuto) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <form
                        onSubmit={editingAuto ? handleUpdateAutomation : handleCreateAutomation}
                        className="p-5 rounded-2xl space-y-4"
                        style={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {editingAuto ? 'Edit Custom Automation Card' : 'Create Custom Automation Card'}
                          </h3>
                          {editingAuto && (
                            <button
                              type="button"
                              onClick={() => setEditingAuto(null)}
                              className="p-1 rounded-lg cursor-pointer transition-colors"
                              style={{ color: 'var(--muted-fg)' }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Name */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium" style={{ color: 'var(--muted-fg)' }}>
                              Automation Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Canvas Discussion Auditor"
                              value={editingAuto ? editAutoForm.name : addAutoForm.name}
                              onChange={(e) => editingAuto
                                ? setEditAutoForm({ ...editAutoForm, name: e.target.value })
                                : setAddAutoForm({ ...addAutoForm, name: e.target.value })
                              }
                              required
                              className="px-3 py-2 text-xs rounded-xl"
                              style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            />
                          </div>

                          {/* Program */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium" style={{ color: 'var(--muted-fg)' }}>
                              Program Category
                            </label>
                            <input
                              type="text"
                              list="existing-programs"
                              placeholder="e.g. MBA, BBA, B.Tech, Operations..."
                              value={editingAuto ? editAutoForm.program : addAutoForm.program}
                              onChange={(e) => editingAuto
                                ? setEditAutoForm({ ...editAutoForm, program: e.target.value })
                                : setAddAutoForm({ ...addAutoForm, program: e.target.value })
                              }
                              required
                              className="px-3 py-2 text-xs rounded-xl"
                              style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            />
                            <datalist id="existing-programs">
                              {existingCategories.map((cat) => (
                                <option key={cat} value={cat} />
                              ))}
                            </datalist>
                          </div>

                          {/* Hyperlink */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium" style={{ color: 'var(--muted-fg)' }}>
                              Hyperlink URL (Automation Tool Link)
                            </label>
                            <input
                              type="url"
                              placeholder="https://canvas.upgrad.com/auditor"
                              value={editingAuto ? editAutoForm.link : addAutoForm.link}
                              onChange={(e) => editingAuto
                                ? setEditAutoForm({ ...editAutoForm, link: e.target.value })
                                : setAddAutoForm({ ...addAutoForm, link: e.target.value })
                              }
                              required
                              className="px-3 py-2 text-xs rounded-xl"
                              style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            />
                          </div>

                          {/* Status */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium" style={{ color: 'var(--muted-fg)' }}>
                              Development Status
                            </label>
                            <select
                              value={editingAuto ? editAutoForm.status : addAutoForm.status}
                              onChange={(e) => editingAuto
                                ? setEditAutoForm({ ...editAutoForm, status: e.target.value })
                                : setAddAutoForm({ ...addAutoForm, status: e.target.value })
                              }
                              className="px-3 py-2 text-xs rounded-xl cursor-pointer"
                              style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            >
                              <option value="live">Live</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="development">In Development</option>
                            </select>
                          </div>

                          {/* Frequency Per Week */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium" style={{ color: 'var(--muted-fg)' }}>
                              How many times is this automation used per week?
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="7"
                              placeholder="e.g. 3"
                              value={editingAuto ? editAutoForm.frequency_per_week : addAutoForm.frequency_per_week}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.min(7, Number(e.target.value));
                                editingAuto
                                  ? setEditAutoForm({ ...editAutoForm, frequency_per_week: val })
                                  : setAddAutoForm({ ...addAutoForm, frequency_per_week: val });
                              }}
                              required
                              className="px-3 py-2 text-xs rounded-xl"
                              style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            />
                          </div>

                          {/* Time Saved Per Run */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium" style={{ color: 'var(--muted-fg)' }}>
                              How much time does this automation save per run? (in minutes)
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 30"
                              value={editingAuto ? editAutoForm.time_saved_per_run : addAutoForm.time_saved_per_run}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                editingAuto
                                  ? setEditAutoForm({ ...editAutoForm, time_saved_per_run: val })
                                  : setAddAutoForm({ ...addAutoForm, time_saved_per_run: val });
                              }}
                              required
                              className="px-3 py-2 text-xs rounded-xl"
                              style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-medium" style={{ color: 'var(--muted-fg)' }}>
                            Description
                          </label>
                          <textarea
                            placeholder="Briefly describe what this automation does..."
                            value={editingAuto ? editAutoForm.description : addAutoForm.description}
                            onChange={(e) => editingAuto
                              ? setEditAutoForm({ ...editAutoForm, description: e.target.value })
                              : setAddAutoForm({ ...addAutoForm, description: e.target.value })
                            }
                            required
                            rows={2}
                            className="px-3 py-2 text-xs rounded-xl resize-none"
                            style={{
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--foreground)',
                            }}
                          />
                        </div>

                        {(editingAuto ? editAutoError : addAutoError) && (
                          <p className="text-xs" style={{ color: 'var(--danger)' }}>
                            {editingAuto ? editAutoError : addAutoError}
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <motion.button
                            type="submit"
                            disabled={editingAuto ? editAutoLoading : addAutoLoading}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer"
                            style={{
                              background: 'var(--accent)',
                              color: '#ffffff',
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {(editingAuto ? editAutoLoading : addAutoLoading) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : editingAuto ? (
                              <Check size={12} />
                            ) : (
                              <Plus size={12} />
                            )}
                            {editingAuto ? 'Save Changes' : 'Create Card'}
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => editingAuto ? setEditingAuto(null) : setShowAddAuto(false)}
                            className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer"
                            style={{
                              background: 'var(--surface)',
                              color: 'var(--muted-fg)',
                              border: '1px solid var(--border-color)',
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Table list */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="overflow-x-auto">
                  {autosLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
                            Automation
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
                            Program
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
                            Savings Profile
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
                            Enabled
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAutomations.map((auto) => {
                          const isDb = true;
                          return (
                            <tr
                              key={auto.id}
                              style={{ borderBottom: '1px solid var(--border-color)' }}
                            >
                              <td className="px-4 py-3">
                                <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                                  {auto.name}
                                </span>
                              </td>
                              <td className="px-4 py-3">
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
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-0.5 text-xs">
                                  <span className="font-semibold text-emerald-500">
                                    {auto.time_saved_per_run || 0} mins saved in one-time operation
                                  </span>
                                  <span className="text-[10px]" style={{ color: 'var(--muted-fg)' }}>
                                    Runs {auto.frequency_per_week || 1} times/week
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={auto.status || 'live'}
                                  onChange={(e) => changeAutomationStatus(auto.id, e.target.value)}
                                  className="px-2 py-1 text-[10px] font-medium rounded-lg cursor-pointer"
                                  style={{
                                    background: 'var(--surface)',
                                    color: 'var(--foreground)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  <option value="live">Live</option>
                                  <option value="maintenance">Maintenance</option>
                                  <option value="development">Development</option>
                                  <option value="unavailable">Unavailable</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => toggleAutomation(auto.id, auto.enabled)}
                                  className="cursor-pointer"
                                  style={{ color: auto.enabled ? 'var(--success)' : 'var(--muted-fg)' }}
                                >
                                  {auto.enabled ? (
                                    <ToggleRight size={22} />
                                  ) : (
                                    <ToggleLeft size={22} />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`inline-block text-center w-[92px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg ${auto.status === 'live'
                                        ? 'status-live'
                                        : auto.status === 'maintenance'
                                          ? 'status-maintenance'
                                          : auto.status === 'development'
                                            ? 'status-development'
                                            : 'status-unavailable'
                                      }`}
                                  >
                                    {auto.enabled ? auto.status : 'Disabled'}
                                  </span>

                                  {/* Edit & Delete dynamic ones */}
                                  {isDb ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleStartEdit(auto)}
                                        className="p-1 rounded-lg cursor-pointer transition-colors"
                                        style={{ color: 'var(--muted-fg)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-fg)'}
                                        title="Edit Card Details"
                                      >
                                        <Edit size={14} />
                                      </button>

                                      {confirmDeleteAuto === auto.id ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleDeleteAuto(auto.id)}
                                            className="px-2 py-0.5 text-[10px] font-semibold rounded-lg cursor-pointer"
                                            style={{
                                              background: 'rgba(239, 68, 68, 0.1)',
                                              color: 'var(--danger)',
                                              border: '1px solid rgba(239, 68, 68, 0.2)'
                                            }}
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => setConfirmDeleteAuto(null)}
                                            className="px-2 py-0.5 text-[10px] font-semibold rounded-lg cursor-pointer"
                                            style={{
                                              background: 'var(--surface)',
                                              color: 'var(--muted-fg)',
                                              border: '1px solid var(--border-color)'
                                            }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setConfirmDeleteAuto(auto.id)}
                                          className="p-1 rounded-lg cursor-pointer transition-colors"
                                          style={{ color: 'var(--muted-fg)' }}
                                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-fg)'}
                                          title="Delete Custom Card"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-zinc-500 font-medium select-none">Static File</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredAutomations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-xs" style={{ color: 'var(--muted-fg)' }}>
                              No automations found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Add User Button */}
              {isAdmin && (
                <div className="mb-4">
                  <motion.button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all duration-200"
                    style={{
                      background: 'var(--accent)',
                      color: '#ffffff',
                      border: '1px solid var(--accent)',
                    }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 15px var(--glow-color)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <UserPlus size={14} />
                    Add User
                  </motion.button>
                </div>
              )}

              {/* Add User Form */}
              <AnimatePresence>
                {showAddUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <form
                      onSubmit={handleAddUser}
                      className="p-5 rounded-2xl space-y-3"
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Add New User
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={addUserForm.name}
                          onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                          required
                          className="px-3 py-2 text-xs rounded-xl"
                          style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--foreground)',
                          }}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={addUserForm.email}
                          onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                          required
                          className="px-3 py-2 text-xs rounded-xl"
                          style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--foreground)',
                          }}
                        />
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={addUserForm.password}
                            onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                            required
                            className="w-full px-3 py-2 pr-10 text-xs rounded-xl"
                            style={{
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--foreground)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 p-1 rounded-lg text-zinc-400 hover:text-zinc-200 focus:outline-none cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <select
                          value={addUserForm.role}
                          onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                          className="px-3 py-2 text-xs rounded-xl cursor-pointer"
                          style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--foreground)',
                          }}
                        >
                          <option value="user">User</option>
                          <option value="co_admin">Co-Admin</option>
                        </select>
                      </div>

                      {addUserError && (
                        <p className="text-xs" style={{ color: 'var(--danger)' }}>{addUserError}</p>
                      )}

                      <div className="flex gap-2">
                        <motion.button
                          type="submit"
                          disabled={addUserLoading}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer"
                          style={{
                            background: 'var(--accent)',
                            color: '#ffffff',
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {addUserLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Create
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setShowAddUser(false);
                            setShowPassword(false);
                          }}
                          className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer"
                          style={{
                            background: 'var(--surface)',
                            color: 'var(--muted-fg)',
                            border: '1px solid var(--border-color)',
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Users Table */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Name</th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Email</th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Role</th>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Status</th>
                          {isAdmin && (
                            <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const displayAvatar = u.id === profile?.id ? profile?.avatar_url : u.avatar_url;
                          return (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td 
                                onClick={() => handleSelectUser(u)}
                                className="px-4 py-3 text-xs font-medium flex items-center gap-2.5 cursor-pointer group/name hover:text-accent transition-colors"
                                style={{ color: 'var(--foreground)' }}
                                title="Click to view details & password security history"
                              >
                                <div className="w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-[9px] overflow-hidden flex-shrink-0"
                                     style={{
                                       background: 'var(--surface)',
                                       borderColor: 'var(--border-color)',
                                       color: 'var(--foreground)'
                                     }}>
                                  {displayAvatar ? (
                                    <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                    u.name ? u.name.charAt(0).toUpperCase() : 'U'
                                  )}
                                </div>
                                <span className="group-hover/name:underline decoration-dotted decoration-accent/40 underline-offset-4">{u.name || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-fg)' }}>
                                {u.email}
                              </td>
                              <td className="px-4 py-3">
                                {isAdmin && u.id !== profile?.id ? (
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    className="px-2 py-1 text-[10px] font-medium rounded-lg cursor-pointer"
                                    style={{
                                      background: 'var(--surface)',
                                      color: 'var(--foreground)',
                                      border: '1px solid var(--border-color)',
                                    }}
                                  >
                                    <option value="user">User</option>
                                    <option value="co_admin">Co-Admin</option>
                                  </select>
                                ) : (
                                  <span
                                    className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg"
                                    style={{
                                      background: 'var(--surface)',
                                      color: 'var(--accent)',
                                      border: '1px solid var(--border-color)',
                                    }}
                                  >
                                    {u.role?.replace('_', ' ')}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => isAdmin && u.id !== profile?.id && handleToggleActive(u.id, u.active)}
                                  disabled={u.id === profile?.id}
                                  className={isAdmin && u.id !== profile?.id ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                                  style={{ color: u.active ? 'var(--success)' : 'var(--muted-fg)' }}
                                  title={u.id === profile?.id ? "You cannot disable your own logged-in account" : ""}
                                >
                                  {u.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                              </td>
                              {isAdmin && (
                                <td className="px-4 py-3">
                                  {u.id !== profile?.id && (
                                    <>
                                      {confirmDelete === u.id ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="px-2 py-1 text-[10px] font-medium rounded-lg cursor-pointer"
                                            style={{
                                              background: 'rgba(239, 68, 68, 0.1)',
                                              color: 'var(--danger)',
                                              border: '1px solid rgba(239, 68, 68, 0.2)',
                                            }}
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="px-2 py-1 text-[10px] font-medium rounded-lg cursor-pointer"
                                            style={{
                                              background: 'var(--surface)',
                                              color: 'var(--muted-fg)',
                                              border: '1px solid var(--border-color)',
                                            }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setConfirmDelete(u.id)}
                                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                                          style={{ color: 'var(--muted-fg)' }}
                                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-fg)'}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-xs" style={{ color: 'var(--muted-fg)' }}>
                              {users.length === 0
                                ? 'No users found. Connect Supabase to manage users.'
                                : 'No users found matching your search.'
                              }
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ACTIVITY LOGS TAB */}
          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  </div>
                ) : logs.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      {filteredLogs.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>User</th>
                              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Automation</th>
                              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Program</th>
                              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedLogs.map((log, i) => {
                              const matchedUser = users.find(u => u.email?.toLowerCase() === log.user_email?.toLowerCase());
                              const displayName = matchedUser?.name || log.user_email;
                              return (
                                <tr key={log.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground)' }}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{displayName}</span>
                                      {matchedUser && (
                                        <span className="text-[10px]" style={{ color: 'var(--muted-fg)' }}>{log.user_email}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground)' }}>{log.automation_name}</td>
                                  <td className="px-4 py-3">
                                    <span
                                      className="px-2 py-0.5 text-[10px] font-medium rounded-lg"
                                      style={{
                                        background: 'var(--surface)',
                                        color: 'var(--muted-fg)',
                                        border: '1px solid var(--border-color)',
                                      }}
                                    >
                                      {log.program_name}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-fg)' }}>
                                    {new Date(log.clicked_at).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-12 text-center">
                          <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                            No activity logs found matching your search.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {filteredLogs.length > 0 && (
                      <div
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        {/* Left side: Entries summary */}
                        <div className="text-[11px]" style={{ color: 'var(--muted-fg)' }}>
                          Showing{' '}
                          <span className="font-semibold text-foreground">
                            {Math.min(filteredLogs.length, (logsPage - 1) * logsPerPage + 1)}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold text-foreground">
                            {Math.min(filteredLogs.length, logsPage * logsPerPage)}
                          </span>{' '}
                          of{' '}
                          <span className="font-semibold text-foreground">{filteredLogs.length}</span>{' '}
                          logs
                        </div>

                        {/* Right side: Page navigation & Page size selector */}
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Logs per page dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: 'var(--muted-fg)' }}>
                              Rows per page:
                            </span>
                            <select
                              value={logsPerPage}
                              onChange={(e) => {
                                setLogsPerPage(Number(e.target.value));
                                setLogsPage(1);
                              }}
                              className="px-2 py-1 text-[10px] rounded-lg cursor-pointer transition-colors"
                              style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            >
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </div>

                          {/* Page Numbers */}
                          <div className="flex items-center gap-1">
                            {/* Previous page */}
                            <button
                              onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                              disabled={logsPage === 1}
                              className={`p-1.5 rounded-lg border transition-all duration-200 ${
                                logsPage === 1
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'cursor-pointer hover:bg-surface-hover'
                              }`}
                              style={{
                                background: 'var(--surface)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            >
                              <ChevronLeft size={12} />
                            </button>

                            {/* Dynamic page buttons */}
                            {(() => {
                              const pages = [];
                              const maxVisiblePages = 5;
                              let startPage = Math.max(1, logsPage - Math.floor(maxVisiblePages / 2));
                              let endPage = Math.min(totalLogsPages, startPage + maxVisiblePages - 1);

                              if (endPage - startPage + 1 < maxVisiblePages) {
                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                              }

                              if (startPage > 1) {
                                pages.push(
                                  <button
                                    key={1}
                                    onClick={() => setLogsPage(1)}
                                    className={`w-7 h-7 flex items-center justify-center text-[10px] font-medium rounded-lg border transition-all duration-200 cursor-pointer`}
                                    style={{
                                      background: logsPage === 1 ? 'var(--accent)' : 'var(--surface)',
                                      borderColor: logsPage === 1 ? 'var(--accent)' : 'var(--border-color)',
                                      color: logsPage === 1 ? '#ffffff' : 'var(--foreground)',
                                    }}
                                  >
                                    1
                                  </button>
                                );
                                if (startPage > 2) {
                                  pages.push(
                                    <span
                                      key="start-ellipsis"
                                      className="px-1 text-[10px]"
                                      style={{ color: 'var(--muted-fg)' }}
                                    >
                                      ...
                                    </span>
                                  );
                                }
                              }

                              for (let p = startPage; p <= endPage; p++) {
                                pages.push(
                                  <button
                                    key={p}
                                    onClick={() => setLogsPage(p)}
                                    className={`w-7 h-7 flex items-center justify-center text-[10px] font-medium rounded-lg border transition-all duration-200 cursor-pointer`}
                                    style={{
                                      background: logsPage === p ? 'var(--accent)' : 'var(--surface)',
                                      borderColor: logsPage === p ? 'var(--accent)' : 'var(--border-color)',
                                      color: logsPage === p ? '#ffffff' : 'var(--foreground)',
                                    }}
                                  >
                                    {p}
                                  </button>
                                );
                              }

                              if (endPage < totalLogsPages) {
                                if (endPage < totalLogsPages - 1) {
                                  pages.push(
                                    <span
                                      key="end-ellipsis"
                                      className="px-1 text-[10px]"
                                      style={{ color: 'var(--muted-fg)' }}
                                    >
                                      ...
                                    </span>
                                  );
                                }
                                pages.push(
                                  <button
                                    key={totalLogsPages}
                                    onClick={() => setLogsPage(totalLogsPages)}
                                    className={`w-7 h-7 flex items-center justify-center text-[10px] font-medium rounded-lg border transition-all duration-200 cursor-pointer`}
                                    style={{
                                      background: logsPage === totalLogsPages ? 'var(--accent)' : 'var(--surface)',
                                      borderColor: logsPage === totalLogsPages ? 'var(--accent)' : 'var(--border-color)',
                                      color: logsPage === totalLogsPages ? '#ffffff' : 'var(--foreground)',
                                    }}
                                  >
                                    {totalLogsPages}
                                  </button>
                                );
                              }

                              return pages;
                            })()}

                            {/* Next page */}
                            <button
                              onClick={() => setLogsPage((p) => Math.min(totalLogsPages, p + 1))}
                              disabled={logsPage === totalLogsPages}
                              className={`p-1.5 rounded-lg border transition-all duration-200 ${
                                logsPage === totalLogsPages
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'cursor-pointer hover:bg-surface-hover'
                              }`}
                              style={{
                                background: 'var(--surface)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--foreground)',
                              }}
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      No activity logs yet. Connect Supabase to track user activity.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* User Details & Password History Modal */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl overflow-hidden border shadow-2xl flex flex-col backdrop-blur-xl"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--foreground)',
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border-color)', background: 'var(--surface)' }}
            >
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-accent" />
                <span className="text-[13px] font-bold tracking-wide">
                  User Details & Password History
                </span>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="p-1 rounded-lg hover:bg-surface text-zinc-400 hover:text-white cursor-pointer transition-colors border-0"
                style={{ background: 'transparent' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* User Profiling block */}
              <div
                className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border-color)' }}
              >
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-xl border flex items-center justify-center font-bold text-xl overflow-hidden flex-shrink-0"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--foreground)',
                  }}
                >
                  {selectedUserForDetails.avatar_url ? (
                    <img
                      src={selectedUserForDetails.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedUserForDetails.name
                      ? selectedUserForDetails.name.charAt(0).toUpperCase()
                      : 'U'
                  )}
                </div>

                {/* Profile Details */}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h3 className="text-sm font-bold">{selectedUserForDetails.name || '—'}</h3>
                  <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                    {selectedUserForDetails.email}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span
                      className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-lg"
                      style={{
                        background: 'var(--input-bg)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {selectedUserForDetails.role?.replace('_', ' ')}
                    </span>
                    <span
                      className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-lg"
                      style={{
                        background: selectedUserForDetails.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: selectedUserForDetails.active ? 'var(--success)' : 'var(--danger)',
                        border: selectedUserForDetails.active ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      {selectedUserForDetails.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                  Current Recoverable Password
                </h4>
                <div
                  className="flex items-center justify-between p-3 rounded-xl border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono select-all">
                      {selectedUserForDetails.current_password
                        ? (showDetailsPassword ? selectedUserForDetails.current_password : '••••••••••••')
                        : 'No password recorded'}
                    </span>
                  </div>
                  {selectedUserForDetails.current_password && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowDetailsPassword(!showDetailsPassword)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-hover cursor-pointer transition-all border-0 bg-transparent"
                        title={showDetailsPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showDetailsPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyPassword(selectedUserForDetails.current_password)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-hover cursor-pointer transition-all border-0 bg-transparent flex items-center gap-1"
                        title="Copy Password"
                      >
                        {copied ? (
                          <Check size={14} className="text-emerald-500 animate-pulse" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {!selectedUserForDetails.current_password && (
                  <p className="text-[10px]" style={{ color: 'var(--muted-fg)' }}>
                    This user has not set a password or was created externally. Once they update their password in settings, it will appear here.
                  </p>
                )}
              </div>

              {/* Password History Logs */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                  Password Change History Log
                </h4>
                <div
                  className="border rounded-xl overflow-hidden"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={16} className="animate-spin text-accent" />
                    </div>
                  ) : passwordHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr
                            style={{
                              background: 'var(--surface)',
                              borderBottom: '1px solid var(--border-color)',
                            }}
                          >
                            <th className="px-4 py-2 font-medium" style={{ color: 'var(--muted-fg)' }}>
                              Password
                            </th>
                            <th className="px-4 py-2 font-medium" style={{ color: 'var(--muted-fg)' }}>
                              Changed By
                            </th>
                            <th className="px-4 py-2 font-medium" style={{ color: 'var(--muted-fg)' }}>
                              Date Changed
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {passwordHistory.map((history) => (
                            <tr
                              key={history.id}
                              style={{ borderBottom: '1px solid var(--border-color)' }}
                            >
                              <td className="px-4 py-2 font-mono select-all">
                                {history.password}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-lg"
                                  style={{
                                    background: 'var(--surface)',
                                    color: history.changed_by === 'user' ? 'var(--accent)' : 'var(--muted-fg)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  {history.changed_by}
                                </span>
                              </td>
                              <td className="px-4 py-2" style={{ color: 'var(--muted-fg)' }}>
                                {new Date(history.changed_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs" style={{ color: 'var(--muted-fg)' }}>
                      No password history logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="px-5 py-3 border-t flex justify-end"
              style={{ borderColor: 'var(--border-color)', background: 'var(--surface)' }}
            >
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer hover:bg-surface-hover transition-all"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border-color)',
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
