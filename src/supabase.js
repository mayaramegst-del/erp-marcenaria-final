import { createClient } from '@supabase/supabase-js';

let supabase = null;
try {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) supabase = createClient(url, key);
} catch {}

export { supabase };

export const dbGet = async (k) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('erp_data').select('data').eq('key', k).single();
    if (error) return null;
    return data?.data ?? null;
  } catch { return null; }
};

export const dbSet = async (k, v) => {
  if (!supabase) return;
  try {
    await supabase.from('erp_data').upsert({ key: k, data: v, updated_at: new Date().toISOString() });
  } catch {}
};
