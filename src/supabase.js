// ─── SUPABASE — fetch direto (sem JS client) ───────────────────────────────
// O cliente JS (@supabase/supabase-js) tem incompatibilidade com o formato
// de chave sb_publishable_*. Usamos fetch nativo que funciona 100%.

const SB_URL  = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ENABLED = !!(SB_URL && SB_KEY);

const headers = () => ({
  'apikey':        SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'resolution=merge-duplicates,return=minimal',
});

export const dbGet = async (k) => {
  if (!ENABLED) return null;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/erp_data?select=data&key=eq.${encodeURIComponent(k)}&limit=1`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    if (!res.ok) { console.warn('[dbGet] HTTP', res.status, k); return null; }
    const rows = await res.json();
    return rows.length ? rows[0].data : null;
  } catch (e) { console.warn('[dbGet] error', k, e); return null; }
};

export const dbSet = async (k, v) => {
  if (!ENABLED) return false;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/erp_data?on_conflict=key`,
      {
        method:  'POST',
        headers: headers(),
        body:    JSON.stringify({ key: k, data: v, updated_at: new Date().toISOString() }),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      console.warn('[dbSet] HTTP', res.status, k, txt);
      return false;
    }
    return true;
  } catch (e) { console.warn('[dbSet] error', k, e); return false; }
};

// Salva múltiplas chaves em paralelo — retorna { ok, fail }
export const dbSetMany = async (entries) => {
  if (!ENABLED) return { ok: 0, fail: entries.length };
  const results = await Promise.all(
    entries.map(([k, v]) => dbSet(k, v).then(ok => ({ k, ok })))
  );
  return {
    ok:   results.filter(r => r.ok).length,
    fail: results.filter(r => !r.ok).map(r => r.k),
  };
};
