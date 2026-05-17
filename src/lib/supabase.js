import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey;

// Create client only if properly configured, otherwise use a dummy
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check if Supabase is available
export function isSupabaseConfigured() {
  return isConfigured && supabase !== null;
}

// ============================================================
// AUTH HELPERS
// ============================================================

export async function signIn(email, password) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured. Add credentials to .env.local' } };
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email, password) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  if (!supabase) return { session: null, error: null };
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getUser() {
  if (!supabase) return { user: null, error: null };
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// ============================================================
// PROFILE HELPERS
// ============================================================

export async function getUserProfile(userId) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function getAllProfiles() {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function updateProfile(userId, updates) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

export async function createProfile(profileData) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();
  return { data, error };
}

export async function deleteProfile(userId) {
  if (!supabase) return { error: null };
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  return { error };
}

// ============================================================
// ACTIVITY LOG HELPERS
// ============================================================

export async function logActivity(userEmail, automationName, programName) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_email: userEmail,
      automation_name: automationName,
      program_name: programName,
      clicked_at: new Date().toISOString(),
    });
  return { data, error };
}

export async function getActivityLogs(limit = 50) {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('clicked_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function getActivityLogsByUser(userEmail) {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_email', userEmail)
    .order('clicked_at', { ascending: false });
  return { data, error };
}

// ============================================================
// DYNAMIC AUTOMATION HELPERS
// ============================================================

export async function getDbAutomations() {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createDbAutomation(automationData) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from('automations')
    .insert({
      ...automationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  return { data, error };
}

export async function updateDbAutomation(id, updates) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from('automations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteDbAutomation(id) {
  if (!supabase) return { error: null };
  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id);
  return { error };
}
