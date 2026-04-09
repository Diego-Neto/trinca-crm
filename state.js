// ═══════════════════════════════════════════════════
// TRINCA DA CERTEZA 4.0 — State (DB Abstraction Layer)
// Cache em memória (sync) + IndexedDB como backing store
// Migração automática de localStorage → IndexedDB
// ═══════════════════════════════════════════════════

var _cache = {};
var _dbInstance = null;
var _DB_NAME = 'trinca_certeza';
var _DB_VERSION = 1;
var _STORE = 'kv';

var _KEYS = [
  'tc_leads', 'tc_config', 'tc_state', 'tc_state_history',
  'tc_calls_today', 'tc_debriefs', 'tc_metrics', 'tc_tasks',
  'tc_touchlog', 'tc_analytics', 'tc_lead_ctx'
];

var _DEFAULTS = {
  tc_leads: '[]', tc_config: '{"meta":5,"diasUteis":22}',
  tc_state: '{"date":"","humor":7,"energia":7}', tc_state_history: '[]',
  tc_calls_today: '{"date":"","count":0}', tc_debriefs: '[]',
  tc_metrics: '[]', tc_tasks: '[]', tc_touchlog: '[]',
  tc_analytics: '{}', tc_lead_ctx: '{}'
};

// --- IndexedDB helpers (async, background) ---

function _openIDB() {
  if (_dbInstance) return Promise.resolve(_dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(_DB_NAME, _DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(_STORE);
    req.onsuccess = () => {
      _dbInstance = req.result;
      _dbInstance.onclose = () => { _dbInstance = null; };
      resolve(_dbInstance);
    };
    req.onerror = () => reject(req.error);
  });
}

function _idbGet(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction(_STORE, 'readonly');
    const req = tx.objectStore(_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
}

function _idbPut(db, key, value) {
  return new Promise((resolve) => {
    const tx = db.transaction(_STORE, 'readwrite');
    tx.objectStore(_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// --- Cache invalidation (chamada após sync do Supabase) ---
function _invalidateCache() {
  _cache = {};
  _parsedLeadsCache = null;
  _parsedLeadsCacheRaw = null;
}

// --- Sync read/write via in-memory cache ---

function _get(key) {
  if (_cache[key] !== undefined) return _cache[key];
  const val = localStorage.getItem(key) || _DEFAULTS[key] || null;
  return val;
}

function _set(key, value) {
  _cache[key] = value;
  localStorage.setItem(key, value);
  // Background persist to IndexedDB (fire-and-forget)
  _openIDB().then(db => _idbPut(db, key, value)).catch(() => {});
}

// --- Migration: localStorage → IndexedDB (runs once on load) ---

async function _migrateToIDB() {
  try {
    const db = await _openIDB();
    const migrated = await _idbGet(db, '_migrated');
    if (migrated) {
      // Already migrated — hydrate cache from IDB
      for (const key of _KEYS) {
        const val = await _idbGet(db, key);
        if (val !== undefined) _cache[key] = val;
      }
      // Also hydrate message logs
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tc_ml_')) {
          const val = await _idbGet(db, k);
          if (val !== undefined) _cache[k] = val;
        }
      }
      return;
    }
    // First run: copy localStorage → IDB
    for (const key of _KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        await _idbPut(db, key, val);
        _cache[key] = val;
      }
    }
    // Migrate message logs
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tc_ml_')) {
        const val = localStorage.getItem(k);
        if (val) await _idbPut(db, k, val);
      }
    }
    await _idbPut(db, '_migrated', true);
    console.log('[State] Migração localStorage → IndexedDB concluída');
  } catch (e) {
    console.warn('[State] IndexedDB indisponível, usando localStorage:', e.message);
  }
}

// Kick off migration on load
_migrateToIDB();

// --- Memoização de getLeads (Sprint 2A) ---
var _parsedLeadsCache = null;
var _parsedLeadsCacheRaw = null;

// --- Public API (100% sync, mesmo interface de antes) ---

var DB = {
  getLeads: function() {
    var raw = _get('tc_leads') || '[]';
    if (raw === _parsedLeadsCacheRaw && _parsedLeadsCache) return _parsedLeadsCache;
    _parsedLeadsCache = JSON.parse(raw);
    _parsedLeadsCacheRaw = raw;
    return _parsedLeadsCache;
  },
  saveLeads: function(l) {
    _parsedLeadsCache = l;
    var json = JSON.stringify(l);
    _parsedLeadsCacheRaw = json;
    _set('tc_leads', json);
  },
  saveLead: function(lead) {
    lead._syncVersion = (lead._syncVersion || 0) + 1;
    lead.ultimaAtualizacao = new Date().toISOString().split('T')[0];
    var leads = this.getLeads();
    var idx = leads.findIndex(function(l) { return l.id === lead.id; });
    if (idx >= 0) leads[idx] = lead; else leads.push(lead);
    this.saveLeads(leads);
    return lead;
  },
  getConfig: () => JSON.parse(_get('tc_config') || '{"meta":5,"diasUteis":22}'),
  saveConfig: (c) => _set('tc_config', JSON.stringify(c)),
  getState: () => {
    const s = JSON.parse(_get('tc_state') || '{"date":"","humor":7,"energia":7}');
    if (s.value !== undefined && s.humor === undefined) { s.humor = s.value; s.energia = s.value; delete s.value; }
    return s;
  },
  saveState: (s) => _set('tc_state', JSON.stringify(s)),
  getStateHistory: () => JSON.parse(_get('tc_state_history') || '[]'),
  saveStateHistory: (h) => _set('tc_state_history', JSON.stringify(h)),
  getCallsToday: () => JSON.parse(_get('tc_calls_today') || '{"date":"","count":0}'),
  saveCallsToday: (c) => _set('tc_calls_today', JSON.stringify(c)),
  getDebriefs: () => JSON.parse(_get('tc_debriefs') || '[]'),
  saveDebriefs: (d) => _set('tc_debriefs', JSON.stringify(d)),
  getMetrics: () => JSON.parse(_get('tc_metrics') || '[]'),
  saveMetrics: (m) => _set('tc_metrics', JSON.stringify(m)),
  getTasks: () => JSON.parse(_get('tc_tasks') || '[]'),
  saveTasks: (t) => _set('tc_tasks', JSON.stringify(t)),
  getTouchlog: () => JSON.parse(_get('tc_touchlog') || '[]'),
  saveTouchlog: (t) => _set('tc_touchlog', JSON.stringify(t.slice(-800))),
  getAnalytics: () => JSON.parse(_get('tc_analytics') || '{}'),
  saveAnalytics: (a) => _set('tc_analytics', JSON.stringify(a)),
  getLeadCtx: () => JSON.parse(_get('tc_lead_ctx') || '{}'),
  saveLeadCtx: (c) => _set('tc_lead_ctx', JSON.stringify(c)),
  getMsgLog: (leadId) => JSON.parse(_get('tc_ml_'+leadId) || '[]'),
  saveMsgLog: (leadId, logs) => _set('tc_ml_'+leadId, JSON.stringify(logs.slice(-10))),
  // Invalida cache em memória — chamar após sync do Supabase gravar no localStorage
  invalidateCache: () => _invalidateCache(),
};
