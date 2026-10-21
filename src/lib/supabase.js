import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://czvkpmdvaoochgmkhzjt.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Ke0TNyyGbYFp9NgsoZpIBg_OrH2Bewb';

export const supabase = createClient(url, key);
