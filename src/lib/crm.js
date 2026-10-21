import { supabase } from './supabase';

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function listProspects() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('prospects').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProspect(input) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const user = await getCurrentUser();
  if (!user) throw new Error('Please sign in first.');
  const { data: existing, error: duplicateError } = await supabase
    .from('prospects')
    .select('id,name,phone,email,instagram')
    .eq('owner_id', user.id)
    .or([input.phone && `phone.eq.${input.phone}`, input.email && `email.eq.${input.email}`, input.instagram && `instagram.eq.${input.instagram}`].filter(Boolean).join(','));
  if (duplicateError) throw duplicateError;
  if (existing?.length) throw new Error(`Possible duplicate: ${existing[0].name}`);
  const { data, error } = await supabase.from('prospects').insert({ ...input, owner_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateProspect(id, patch) {
  const { data, error } = await supabase.from('prospects').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function listInteractions(prospectId) {
  const { data, error } = await supabase.from('interactions').select('*').eq('prospect_id', prospectId).order('happened_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInteraction(input) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Please sign in first.');
  const { data, error } = await supabase.from('interactions').insert({ ...input, owner_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function listFollowUps() {
  const { data, error } = await supabase.from('follow_ups').select('*, prospects(name)').order('due_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createFollowUp(input) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Please sign in first.');
  const { data, error } = await supabase.from('follow_ups').insert({ ...input, owner_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function completeFollowUp(id) {
  const { data, error } = await supabase.from('follow_ups').update({ completed_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
