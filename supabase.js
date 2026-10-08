(() => {
  const cfg = window.JIRRA_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_KEY && !cfg.SUPABASE_URL.startsWith('PASTE_') && !cfg.SUPABASE_KEY.startsWith('PASTE_');
  window.JIRRA_SUPABASE_CONFIGURED = Boolean(configured);
  window.jirraDb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY) : null;
})();
