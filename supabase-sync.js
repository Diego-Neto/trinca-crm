// ═══════════════════════════════════════════════════════
// TRINCA DA CERTEZA 4.0 — Supabase Sync Layer
// Offline-first: localStorage como cache + sync ao Supabase
// ═══════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://fzocybokxulzchhkupbj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6b2N5Ym9reHVsemNoaGt1cGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDk1OTEsImV4cCI6MjA5MDUyNTU5MX0.q2se5gYIPIuWK-s5bcPWm9NtWhpzLbl_zC1OzXrmZ7o';

// ─── INIT ────────────────────────────────────────────
// navigator.locks polyfill já aplicado no index.html ANTES do CDN carregar.
// NÃO duplicar aqui — o polyfill do index.html é o que importa.
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storageKey: 'trinca-crm-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  }
});
let _currentUser  = null;
let _currentPerfil = null;

// ─── AUTH ────────────────────────────────────────────
const SBAuth = {
  async login(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    await _sb.auth.signOut();
    _currentUser  = null;
    _currentPerfil = null;
    localStorage.removeItem('tc_vendedor_id');
    showLoginScreen();
  },

  async getUser() {
    const { data: { user } } = await _sb.auth.getUser();
    return user;
  },

  onAuthChange(callback) {
    _sb.auth.onAuthStateChange(callback);
  }
};

// ─── PERFIL ───────────────────────────────────────────
const SBPerfil = {
  async load(userId) {
    const { data, error } = await _sb
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async isGestor() {
    return _currentPerfil?.role === 'gestor';
  }
};

// ─── LEADS ────────────────────────────────────────────
const SBLeads = {
  // Converte lead do localStorage para formato Supabase
  _toSB(lead, vendedorId) {
    return {
      id:                     lead.id,
      vendedor_id:            vendedorId || _currentUser?.id,
      nome:                   lead.nome,
      whatsapp:               lead.whatsapp || null,
      instagram:              lead.instagram || null,
      tags:                   lead.tags || [],
      status:                 lead.status || 'NOVO',
      fluxo:                  lead.fluxo || 'FRIO',
      dor:                    lead.dor || null,
      proxima_acao:           lead.proximaAcao || null,
      ticket_estimado:        lead.ticketEstimado || 100000,
      parcela_mensal:         lead.parcelaMensal || 0,
      pilar_fraco:            lead.pilarFraco || null,
      dia_toque_atual:        lead.diaToqueAtual || 0,
      proximo_toque:          lead.proximoToque || null,
      data_hora_diagnostico:  lead.dataHoraDiagnostico || null,
      data_retorno_nutricao:  lead.dataRetornoNutricao || null,
      motivo_nutricao:        lead.motivoNutricao || null,
      motivo_perdido:         lead.motivoPerdido || null,
      data_entrada_geladeira: lead.dataEntradaGeladeira || null,
      motivo_geladeira:       lead.motivoGeladeira || null,
      data_reativacao:        lead.dataReativacao || null,
      gancho_reativacao:      lead.ganchoReativacao || null,
      tentativas_reativacao:  lead.tentativasReativacao || [],
      sonho:                  lead.sonho || null,
      objecao_principal:      lead.objecaoPrincipal || null,
      notas:                  lead.notas || null,
      data_criacao:           lead.dataCriacao || new Date().toISOString().split('T')[0],
      ultima_atualizacao:     lead.ultimaAtualizacao || new Date().toISOString().split('T')[0],
      _sync_version:          lead._syncVersion || 0,
    };
  },

  // Converte lead do Supabase para formato localStorage
  _fromSB(row) {
    return {
      id:                   row.id,
      nome:                 row.nome,
      whatsapp:             row.whatsapp,
      instagram:            row.instagram,
      tags:                 row.tags || [],
      status:               row.status,
      fluxo:                row.fluxo,
      dor:                  row.dor,
      proximaAcao:          row.proxima_acao,
      ticketEstimado:       row.ticket_estimado,
      parcelaMensal:        row.parcela_mensal,
      pilarFraco:           row.pilar_fraco,
      diaToqueAtual:        row.dia_toque_atual,
      proximoToque:         row.proximo_toque,
      dataHoraDiagnostico:  row.data_hora_diagnostico,
      dataRetornoNutricao:  row.data_retorno_nutricao,
      motivoNutricao:       row.motivo_nutricao,
      motivoPerdido:        row.motivo_perdido,
      dataEntradaGeladeira: row.data_entrada_geladeira,
      motivoGeladeira:      row.motivo_geladeira,
      dataReativacao:       row.data_reativacao,
      ganchoReativacao:     row.gancho_reativacao,
      tentativasReativacao: row.tentativas_reativacao || [],
      sonho:                row.sonho || '',
      objecaoPrincipal:     row.objecao_principal || '',
      notas:                row.notas || '',
      dataCriacao:          row.data_criacao,
      ultimaAtualizacao:    row.ultima_atualizacao,
      _syncVersion:         row._sync_version || 0,
      _vendedorId:          row.vendedor_id, // referência para gestor
    };
  },

  async loadAll() {
    const query = _sb.from('leads').select('*').order('ultima_atualizacao', { ascending: false });
    // Gestor vê todos; RLS já garante isso
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(r => this._fromSB(r));
  },

  async upsert(lead) {
    if (!_currentUser?.id) {
      console.error('[SBLeads.upsert] BLOQUEADO: _currentUser é null');
      throw new Error('Usuário não autenticado');
    }
    const row = this._toSB(lead);
    const { data, error } = await _sb.from('leads').upsert(row, { onConflict: 'id' }).select('id');
    if (error) { console.warn('[SBLeads.upsert]', error.message); throw error; }
    if (!data || data.length === 0) {
      console.error('[SBLeads.upsert] RLS BLOQUEOU: lead ' + lead.id + ' não foi gravado!');
      throw new Error('RLS bloqueou escrita do lead ' + (lead.nome || lead.id));
    }
  },

  async upsertBatch(leads) {
    if (!leads.length) return;
    if (!_currentUser?.id) {
      console.error('[SBLeads.upsertBatch] BLOQUEADO: _currentUser é null — dados NÃO enviados');
      throw new Error('Usuário não autenticado — impossível salvar no Supabase');
    }
    const rows = leads.map(l => this._toSB(l));
    const { data, error } = await _sb.from('leads').upsert(rows, { onConflict: 'id' }).select('id');
    if (error) { console.warn('[SBLeads.upsertBatch]', error.message); throw error; }
    if (!data || data.length === 0) {
      console.error('[SBLeads.upsertBatch] RLS BLOQUEOU: upsert retornou 0 linhas! Verifique as policies da tabela leads no Supabase.');
      throw new Error('RLS bloqueou escrita — 0 linhas gravadas. Verifique policies no Supabase Dashboard.');
    }
    if (data.length < rows.length) {
      console.warn(`[SBLeads.upsertBatch] PARCIAL: enviados ${rows.length}, gravados ${data.length}. RLS pode estar bloqueando parte dos leads.`);
    }
  },

  async delete(id) {
    const { error } = await _sb.from('leads').delete().eq('id', id);
    if (error) { console.warn('[SBLeads.delete]', error.message); throw error; }
  }
};

// ─── TOUCHLOG ─────────────────────────────────────────
const SBTouchlog = {
  async append(entry) {
    const { error } = await _sb.from('touchlog').insert({
      vendedor_id: _currentUser?.id,
      lead_id:     entry.leadId,
      canal:       entry.canal,
      tipo:        entry.tipo,
      resultado:   entry.resultado,
      data:        entry.data,
    });
    if (error) { console.warn('[SBTouchlog.append]', error.message); throw error; }
  },

  async loadToday() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await _sb
      .from('touchlog')
      .select('*')
      .eq('data', today);
    if (error) return [];
    return data;
  }
};

// ─── DEBRIEFS ─────────────────────────────────────────
const SBDebriefs = {
  async upsert(debrief) {
    const { error } = await _sb.from('debriefs').upsert({
      id:          debrief.id,
      vendedor_id: _currentUser?.id,
      data:        debrief.date,
      humor:       debrief.humor,
      energia:     debrief.energia,
      fase:        debrief.phase || debrief.fase || null,
      pilar_fraco: debrief.pilarFraco,
      lead_id:     debrief.leadId || null,
      perguntas: {
        velocidadePensamento: debrief.velocidadePensamento || null,
        promessaIndevida:     debrief.promessaIndevida     || null,
        pilarFraco:           debrief.pilarFraco           || null,
        grandiosidade:        debrief.grandiosidade        || null,
        saiuLinhaReta:        debrief.saiuLinhaReta         || null,
        tdahDesviou:          debrief.tdahDesviou          || null,
        proximaAcao:          debrief.proximaAcao          || null,
      }
    }, { onConflict: 'id' });
    if (error) { console.warn('[SBDebriefs.upsert]', error.message); throw error; }
  }
};

// ─── STATE HISTORY ────────────────────────────────────
const SBState = {
  async upsert(entry) {
    const { error } = await _sb.from('state_history').upsert({
      vendedor_id: _currentUser?.id,
      data:        entry.date,
      humor:       entry.humor,
      energia:     entry.energia,
      fase:        entry.phase || entry.fase || null,
    }, { onConflict: 'vendedor_id,data' });
    if (error) { console.warn('[SBState.upsert]', error.message); throw error; }
  }
};

// ─── TASKS ────────────────────────────────────────────
const SBTasks = {
  async upsertBatch(tasks) {
    if (!tasks.length) return;
    const rows = tasks.map(t => ({
      id:          t.id,
      vendedor_id: _currentUser?.id,
      titulo:      t.titulo,
      tipo:        t.tipo || 'tarefa',
      data:        t.data || null,
      lead_id:     t.leadId || null,
      done:        t.done || false,
      created_at:  t.createdAt || new Date().toISOString().split('T')[0],
    }));
    const { error } = await _sb.from('tasks').upsert(rows, { onConflict: 'id' });
    if (error) { console.warn('[SBTasks.upsertBatch]', error.message); throw error; }
  }
};

// ─── CONFIG ───────────────────────────────────────────
const SBConfig = {
  async save(config) {
    const { error } = await _sb.from('config').upsert({
      vendedor_id: _currentUser?.id,
      meta:        config.meta || 5,
      dias_uteis:  config.diasUteis || 22,
    }, { onConflict: 'vendedor_id' });
    if (error) { console.warn('[SBConfig.save]', error.message); throw error; }
  }
};

// ═══════════════════════════════════════════════════════
// SYNC ENGINE — carrega Supabase → localStorage ao iniciar
// ═══════════════════════════════════════════════════════
async function syncFromSupabase(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const cloudLeads = await SBLeads.loadAll();
      // MERGE INTELIGENTE: lead local mais recente ganha sobre cloud
      const localLeads = JSON.parse(_get('tc_leads') || '[]');
      const localMap = {};
      for (const ll of localLeads) { if (ll.id) localMap[ll.id] = ll; }
      const merged = [];
      const cloudIds = new Set();
      for (const cl of cloudLeads) {
        cloudIds.add(cl.id);
        const ll = localMap[cl.id];
        if (ll) {
          // Desempate: data > _syncVersion > cloud ganha
          const localNewer = ll.ultimaAtualizacao > cl.ultimaAtualizacao;
          const sameDate = ll.ultimaAtualizacao === cl.ultimaAtualizacao;
          const localHigherVersion = (ll._syncVersion || 0) > (cl._syncVersion || 0);
          if (localNewer || (sameDate && localHigherVersion)) {
            // Local é mais recente — manter local e enviar pro Supabase
            merged.push(ll);
            SBLeads.upsert(ll).catch(e => PendingQueue.add({ type: 'leads', data: [ll] }));
          } else {
            merged.push(cl);
          }
        } else {
          merged.push(cl);
        }
      }
      // Leads que existem só localmente (não estão no cloud)
      for (const ll of localLeads) {
        if (ll.id && !cloudIds.has(ll.id)) {
          merged.push(ll);
          SBLeads.upsert(ll).catch(e => PendingQueue.add({ type: 'leads', data: [ll] }));
        }
      }
      localStorage.setItem('tc_leads', JSON.stringify(merged));
      console.log(`[Trinca 4.0] ${merged.length} leads sincronizados (${cloudLeads.length} cloud + merge local)`);

      // Sync tasks
      try {
        const tasks = await _sb.from('tasks').select('*').order('created_at', { ascending: false });
        if (tasks.data) localStorage.setItem('tc_tasks', JSON.stringify(tasks.data.map(t => ({
          id: t.id, titulo: t.titulo, tipo: t.tipo, data: t.data,
          leadId: t.lead_id, done: t.done, createdAt: t.created_at
        }))));
      } catch(e) { console.warn('[sync tasks]', e.message); }

      // Sync state_history (streak/cadência do dia)
      try {
        const { data } = await _sb.from('state_history').select('*').order('data', { ascending: false }).limit(60);
        if (data && data.length) {
          const history = data.map(h => ({
            date: h.data, humor: h.humor, energia: h.energia, phase: h.fase || null
          }));
          // Merge: manter entradas locais que ainda não foram pro Supabase
          const localHistory = JSON.parse(_get('tc_state_history') || '[]');
          const cloudDates = new Set(history.map(h => h.date));
          const merged = [...history];
          for (const lh of localHistory) {
            if (!cloudDates.has(lh.date)) merged.push(lh);
          }
          merged.sort((a, b) => b.date.localeCompare(a.date));
          localStorage.setItem('tc_state_history', JSON.stringify(merged));
          // Atualizar estado do dia atual se existir no cloud
          const todayISO = new Date().toISOString().split('T')[0];
          const todayState = data.find(h => h.data === todayISO);
          if (todayState) {
            localStorage.setItem('tc_state', JSON.stringify({
              date: todayState.data, humor: todayState.humor, energia: todayState.energia,
              phase: todayState.fase || null
            }));
          }
        }
      } catch(e) { console.warn('[sync state_history]', e.message); }

      // Sync debriefs
      try {
        const { data } = await _sb.from('debriefs').select('*').order('data', { ascending: false }).limit(30);
        if (data && data.length) {
          const debriefs = data.map(d => ({
            id: d.id, date: d.data, humor: d.humor, energia: d.energia,
            phase: d.fase, pilarFraco: d.pilar_fraco, leadId: d.lead_id,
            ...(d.perguntas || {})
          }));
          const localDebriefs = JSON.parse(_get('tc_debriefs') || '[]');
          const cloudIds = new Set(debriefs.map(d => d.id));
          const merged = [...debriefs];
          for (const ld of localDebriefs) {
            if (!cloudIds.has(ld.id)) merged.push(ld);
          }
          localStorage.setItem('tc_debriefs', JSON.stringify(merged));
        }
      } catch(e) { console.warn('[sync debriefs]', e.message); }

      // Sync touchlog
      try {
        const { data } = await _sb.from('touchlog').select('*').order('data', { ascending: false }).limit(200);
        if (data && data.length) {
          const touchlog = data.map(t => ({
            leadId: t.lead_id, canal: t.canal, tipo: t.tipo,
            resultado: t.resultado, data: t.data
          }));
          const localLog = JSON.parse(_get('tc_touchlog') || '[]');
          // Merge por chave composta (leadId+data+canal)
          const cloudKeys = new Set(touchlog.map(t => `${t.leadId}|${t.data}|${t.canal}`));
          const merged = [...touchlog];
          for (const lt of localLog) {
            const key = `${lt.leadId}|${lt.data}|${lt.canal}`;
            if (!cloudKeys.has(key)) merged.push(lt);
          }
          localStorage.setItem('tc_touchlog', JSON.stringify(merged.slice(-800)));
        }
      } catch(e) { console.warn('[sync touchlog]', e.message); }

      // Sync config
      try {
        const { data } = await _sb.from('config').select('*').limit(1).single();
        if (data) {
          localStorage.setItem('tc_config', JSON.stringify({
            meta: data.meta || 5, diasUteis: data.dias_uteis || 22
          }));
        }
      } catch(e) { /* config pode não existir ainda */ }

      // Invalida cache em memória para que DB.getLeads() leia os dados novos do localStorage
      if (typeof DB !== 'undefined' && DB.invalidateCache) DB.invalidateCache();
      console.log('[Trinca 4.0] Sync completo (leads, tasks, state, debriefs, touchlog, config)');
      return;
    } catch (e) {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 800 * (i + 1)));
        continue;
      }
      console.warn('[syncFromSupabase] falhou, usando cache local:', e.message);
    }
  }
}

// ─── PENDING QUEUE — fila de operações offline ─────
const PendingQueue = {
  _KEY: 'tc_pending_sync',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this._KEY) || '[]'); }
    catch { return []; }
  },

  add(op) {
    const queue = this.getAll();
    queue.push({ ...op, ts: Date.now(), retries: 0 });
    // Limite de 200 itens para não estourar localStorage
    if (queue.length > 200) queue.splice(0, queue.length - 200);
    localStorage.setItem(this._KEY, JSON.stringify(queue));
    SyncStatus.updateBadge();
  },

  remove(index) {
    const queue = this.getAll();
    queue.splice(index, 1);
    localStorage.setItem(this._KEY, JSON.stringify(queue));
    SyncStatus.updateBadge();
  },

  clear() {
    localStorage.removeItem(this._KEY);
    SyncStatus.updateBadge();
  },

  get count() { return this.getAll().length; },

  // Reprocessa a fila inteira
  async flush() {
    const queue = this.getAll();
    if (queue.length === 0) return;
    console.log(`[PendingQueue] Flushing ${queue.length} operações pendentes...`);
    SyncStatus.show('syncing');

    const failed = [];
    for (const op of queue) {
      try {
        if (op.type === 'leads')     await SBLeads.upsertBatch(op.data);
        else if (op.type === 'debrief')  await SBDebriefs.upsert(op.data);
        else if (op.type === 'state')    await SBState.upsert(op.data);
        else if (op.type === 'tasks')    await SBTasks.upsertBatch(op.data);
        else if (op.type === 'config')   await SBConfig.save(op.data);
        else if (op.type === 'touchlog') await SBTouchlog.append(op.data);
      } catch (e) {
        const msg = (e.message || '').toLowerCase();
        const isDuplicate = msg.includes('violates unique constraint') ||
                            msg.includes('duplicate key') ||
                            (e.status === 409) || (e.code === '23505');
        if (isDuplicate) {
          // Dado já existe no banco — remover da fila, não retentar
          console.warn(`[PendingQueue] Duplicata detectada, removendo da fila:`, e.message);
          continue;
        }
        op.retries = (op.retries || 0) + 1;
        if (op.retries < 5) failed.push(op); // Descarta após 5 tentativas
        console.warn(`[PendingQueue] Falha (tentativa ${op.retries}):`, e.message);
      }
    }

    localStorage.setItem(this._KEY, JSON.stringify(failed));
    SyncStatus.updateBadge();
    if (failed.length === 0) {
      SyncStatus.show('ok');
      console.log('[PendingQueue] Fila limpa — tudo sincronizado');
    } else {
      SyncStatus.show('pending');
      console.log(`[PendingQueue] ${failed.length} operações ainda pendentes`);
    }
  }
};

// ─── TOAST DE ERRO VISÍVEL ────────────────────────
function showSyncError(msg) {
  const id = 'sync-error-toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = id;
  toast.style.cssText = 'position:fixed;bottom:70px;right:12px;z-index:9999;background:#1a1f2e;border:1px solid #ef4444;border-radius:8px;padding:10px 14px;font-size:12px;color:#fca5a5;max-width:320px;font-family:system-ui,sans-serif;display:flex;flex-direction:column;gap:6px;animation:fadeIn .2s;';
  toast.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
      <span style="flex:1;word-break:break-word;">${msg}</span>
      <button onclick="this.closest('div[id^=sync-error-toast]').remove()" style="background:none;border:none;color:#ef4444;font-size:14px;cursor:pointer;padding:0;line-height:1;">✕</button>
    </div>
    <button onclick="PendingQueue.clear();this.closest('div[id^=sync-error-toast]').remove();" style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;border-radius:4px;color:#fca5a5;font-size:11px;padding:4px 8px;cursor:pointer;align-self:flex-start;">🗑 Limpar fila</button>
  `;
  document.body.appendChild(toast);
  setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 8000);
}

// ─── TOAST GENÉRICO (informativo) ─────────────────
function showSyncToast(msg, color) {
  color = color || '#a78bfa';
  const id = 'sync-toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = id;
  toast.style.cssText = 'position:fixed;bottom:70px;right:12px;z-index:9999;background:#1a1f2e;border:1px solid ' + color + ';border-radius:8px;padding:10px 14px;font-size:12px;color:' + color + ';max-width:320px;font-family:system-ui,sans-serif;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 5000);
}

// ─── SYNC STATUS INDICATOR ─────────────────────────
const SyncStatus = {
  _pending: 0,
  _errors: [],
  _el: null,

  _getEl() {
    if (this._el) return this._el;
    let el = document.getElementById('sync-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sync-status';
      el.style.cssText = 'position:fixed;bottom:60px;right:12px;z-index:9990;font-size:11px;padding:4px 10px;border-radius:8px;font-weight:700;transition:opacity 0.3s;pointer-events:none;';
      document.body.appendChild(el);
    }
    this._el = el;
    return el;
  },

  _showQueueDetails() {
    const queue = PendingQueue.getAll();
    const n = queue.length;
    if (n === 0) { showSyncToast('Fila vazia — tudo sincronizado.', '#10b981'); return; }
    const tipos = {};
    let oldest = Date.now();
    for (const op of queue) {
      tipos[op.type] = (tipos[op.type] || 0) + 1;
      if (op.ts && op.ts < oldest) oldest = op.ts;
    }
    const ageMin = Math.round((Date.now() - oldest) / 60000);
    const resumo = Object.entries(tipos).map(([t, c]) => `${t}: ${c}`).join(', ');
    showSyncError(`📋 Fila pendente: ${n} ite${n > 1 ? 'ns' : 'm'}\n${resumo}\nMais antigo: ${ageMin} min atrás`);
  },

  show(state) {
    const el = this._getEl();
    el.onclick = null;
    el.style.cursor = 'default';
    el.style.pointerEvents = 'none';
    if (state === 'syncing') {
      el.textContent = '🔄 Sincronizando...';
      el.style.background = 'rgba(139,92,246,0.15)'; el.style.color = '#a78bfa'; el.style.opacity = '1';
    } else if (state === 'ok') {
      el.textContent = '✓ Sincronizado';
      el.style.background = 'rgba(16,185,129,0.15)'; el.style.color = '#10b981'; el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, 2000);
    } else if (state === 'error') {
      const n = PendingQueue.count;
      el.textContent = `⚠ Offline — ${n} pendente${n>1?'s':''} (toque p/ detalhes)`;
      el.style.background = 'rgba(239,68,68,0.15)'; el.style.color = '#ef4444'; el.style.opacity = '1';
      el.style.cursor = 'pointer'; el.style.pointerEvents = 'auto';
      el.onclick = () => this._showQueueDetails();
    } else if (state === 'pending') {
      const n = PendingQueue.count;
      el.textContent = `⏳ ${n} pendente${n>1?'s':''} — aguardando rede (toque p/ detalhes)`;
      el.style.background = 'rgba(245,158,11,0.15)'; el.style.color = '#f59e0b'; el.style.opacity = '1';
      el.style.cursor = 'pointer'; el.style.pointerEvents = 'auto';
      el.onclick = () => this._showQueueDetails();
    }
  },

  updateBadge() {
    const n = PendingQueue.count;
    if (n > 0) this.show('pending');
  },

  track(type, promise, data) {
    this._pending++;
    if (this._pending === 1) this.show('syncing');
    return promise.then(r => {
      this._pending--;
      if (this._pending === 0 && PendingQueue.count === 0) this.show('ok');
      return r;
    }).catch(e => {
      this._pending--;
      this._errors.push({ msg: e.message, at: new Date().toISOString() });
      if (this._errors.length > 20) this._errors.shift();
      // Salva na fila para tentar depois
      PendingQueue.add({ type, data });
      this.show('error');
      const nomes = { leads: 'leads', debrief: 'debrief', state: 'estado', tasks: 'tarefas', config: 'configuração', touchlog: 'registro de toques' };
      showSyncError('Erro ao salvar ' + (nomes[type] || type) + ': ' + e.message);
      console.warn('[Sync Error]', type, e.message);
    });
  }
};

// Intercepta saves do DB original e espelha no Supabase (com fila offline)
function patchDBForSupabase() {
  if (DB._sbPatched) return;
  DB._sbPatched = true;
  const originalSaveLeads = DB.saveLeads.bind(DB);
  DB.saveLeads = function(leads) {
    originalSaveLeads(leads);
    SyncStatus.track('leads', SBLeads.upsertBatch(leads), leads);
  };

  const originalSaveLead = DB.saveLead.bind(DB);
  DB.saveLead = function(lead) {
    const saved = originalSaveLead(lead);
    SyncStatus.track('leads', SBLeads.upsert(saved), [saved]);
    return saved;
  };

  const originalSaveDebriefs = DB.saveDebriefs.bind(DB);
  DB.saveDebriefs = function(debriefs) {
    originalSaveDebriefs(debriefs);
    const latest = debriefs[debriefs.length - 1];
    if (latest) SyncStatus.track('debrief', SBDebriefs.upsert(latest), latest);
  };

  const originalSaveState = DB.saveState.bind(DB);
  DB.saveState = function(state) {
    originalSaveState(state);
    SyncStatus.track('state', SBState.upsert(state), state);
  };

  const originalSaveTasks = DB.saveTasks.bind(DB);
  DB.saveTasks = function(tasks) {
    originalSaveTasks(tasks);
    SyncStatus.track('tasks', SBTasks.upsertBatch(tasks), tasks);
  };

  const originalSaveConfig = DB.saveConfig.bind(DB);
  DB.saveConfig = function(config) {
    originalSaveConfig(config);
    SyncStatus.track('config', SBConfig.save(config), config);
  };

  const originalSaveTouchlog = DB.saveTouchlog.bind(DB);
  DB.saveTouchlog = function(log) {
    originalSaveTouchlog(log);
    const latest = log[log.length - 1];
    if (latest) SyncStatus.track('touchlog', SBTouchlog.append(latest), latest);
  };

  console.log('[Trinca 4.0] DB patchado — sync Supabase ativo');
}

// Expor para debug
window.SyncStatus = SyncStatus;
window.PendingQueue = PendingQueue;

// ═══════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════
function showLoginScreen() {
  let screen = document.getElementById('login-screen');
  if (!screen) {
    screen = document.createElement('div');
    screen.id = 'login-screen';
    screen.innerHTML = `
      <style>
        #login-screen {
          position: fixed; inset: 0; z-index: 9999;
          background: #07080d;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .login-box {
          width: 100%; max-width: 360px; padding: 32px 24px;
          background: #0f1117; border: 1px solid #1f2937; border-radius: 14px;
          margin: 16px;
        }
        .login-logo { font-size: 22px; font-weight: 900; color: #e2e8f0; margin-bottom: 4px; }
        .login-logo span { color: #a78bfa; }
        .login-sub { font-size: 12px; color: #64748b; margin-bottom: 24px; }
        .login-label { font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 5px; display: block; }
        .login-input {
          width: 100%; background: #1a1f2e; border: 1px solid #1f2937;
          border-radius: 8px; padding: 10px 12px; color: #e2e8f0;
          font-size: 14px; outline: none; margin-bottom: 12px;
          box-sizing: border-box;
        }
        .login-input:focus { border-color: #8b5cf6; }
        .login-btn {
          width: 100%; padding: 12px; background: #8b5cf6; border: none;
          border-radius: 8px; color: #fff; font-size: 14px; font-weight: 800;
          cursor: pointer; margin-top: 4px;
        }
        .login-btn:hover { background: #a78bfa; }
        .login-btn:disabled { opacity: 0.5; cursor: default; }
        .login-error { color: #fca5a5; font-size: 12px; margin-top: 8px; display: none; }
      </style>
      <div class="login-box">
        <div class="login-logo">Trinca da <span>Certeza</span></div>
        <div class="login-sub">Realize Consórcios — CRM</div>
        <label class="login-label">E-mail</label>
        <input class="login-input" type="email" id="login-email" placeholder="seu@email.com" autocomplete="email">
        <label class="login-label">Senha</label>
        <input class="login-input" type="password" id="login-senha" placeholder="••••••••" autocomplete="current-password">
        <button class="login-btn" id="login-btn" onclick="doLogin()">Entrar</button>
        <div class="login-error" id="login-error"></div>
        <div style="text-align:center;margin-top:12px;">
          <a href="#" id="login-forgot" onclick="doResetPassword()" style="color:#8b5cf6;font-size:12px;text-decoration:none;">Esqueci minha senha</a>
        </div>
        <div class="login-error" id="login-reset-msg" style="color:#a78bfa;"></div>
      </div>
    `;
    document.body.appendChild(screen);
  }
  screen.style.display = 'flex';
  setTimeout(() => {
    const el = document.getElementById('login-email');
    if (el) el.focus();
  }, 100);
}

function hideLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.style.display = 'none';
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.style.display = '';
}

async function doLogin() {
  const emailEl = document.getElementById('login-email');
  const senhaEl = document.getElementById('login-senha');
  if (!emailEl || !senhaEl) return; // Tela de login não existe ainda
  const email = emailEl.value.trim();
  const senha = senhaEl.value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-error');
  if (!email || !senha) { if (err) { err.style.display = 'block'; err.textContent = 'Preencha e-mail e senha.'; } return; }
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  err.style.display = 'none';
  try {
    await SBAuth.login(email, senha);
    // onAuthChange vai cuidar do restante
  } catch (e) {
    err.style.display = 'block';
    err.textContent = e.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : e.message;
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

async function doResetPassword() {
  const emailEl = document.getElementById('login-email');
  if (!emailEl) return;
  const email = emailEl.value.trim();
  const msg = document.getElementById('login-reset-msg');
  if (!email) { msg.style.display = 'block'; msg.style.color = '#fca5a5'; msg.textContent = 'Digite seu e-mail acima primeiro.'; return; }
  try {
    const { error } = await _sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) throw error;
    msg.style.display = 'block'; msg.style.color = '#a78bfa';
    msg.textContent = '📧 Link de redefinição enviado para ' + email;
  } catch(e) {
    msg.style.display = 'block'; msg.style.color = '#fca5a5';
    msg.textContent = 'Erro: ' + e.message;
  }
}

// ─── TELA DE REDEFINIÇÃO DE SENHA ────────────────────
function showResetPasswordScreen() {
  let screen = document.getElementById('reset-pw-screen');
  if (!screen) {
    screen = document.createElement('div');
    screen.id = 'reset-pw-screen';
    screen.innerHTML = `
      <style>
        #reset-pw-screen {
          position: fixed; inset: 0; z-index: 10000;
          background: #07080d;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .reset-box {
          width: 100%; max-width: 360px; padding: 32px 24px;
          background: #0f1117; border: 1px solid #1f2937; border-radius: 14px;
          margin: 16px;
        }
      </style>
      <div class="reset-box">
        <div class="login-logo">Nova <span>Senha</span></div>
        <div class="login-sub" style="margin-bottom:20px">Digite sua nova senha abaixo</div>
        <label class="login-label">Nova senha</label>
        <input class="login-input" type="password" id="reset-pw-new" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
        <label class="login-label">Confirmar senha</label>
        <input class="login-input" type="password" id="reset-pw-confirm" placeholder="Repita a senha" autocomplete="new-password">
        <button class="login-btn" id="reset-pw-btn" onclick="doUpdatePassword()">Salvar nova senha</button>
        <div class="login-error" id="reset-pw-error"></div>
        <div class="login-error" id="reset-pw-success" style="color:#10b981;"></div>
      </div>
    `;
    document.body.appendChild(screen);
  }
  screen.style.display = 'flex';
  // Esconder login se estiver visível
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.style.display = 'none';
  setTimeout(() => {
    const el = document.getElementById('reset-pw-new');
    if (el) el.focus();
  }, 100);
}

async function doUpdatePassword() {
  const newPw = document.getElementById('reset-pw-new').value;
  const confirmPw = document.getElementById('reset-pw-confirm').value;
  const btn = document.getElementById('reset-pw-btn');
  const err = document.getElementById('reset-pw-error');
  const suc = document.getElementById('reset-pw-success');
  err.style.display = 'none'; suc.style.display = 'none';

  if (!newPw || newPw.length < 6) {
    err.style.display = 'block'; err.textContent = 'A senha deve ter pelo menos 6 caracteres.'; return;
  }
  if (newPw !== confirmPw) {
    err.style.display = 'block'; err.textContent = 'As senhas não coincidem.'; return;
  }

  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    const { error } = await _sb.auth.updateUser({ password: newPw });
    if (error) throw error;
    suc.style.display = 'block'; suc.textContent = 'Senha alterada com sucesso! Carregando dados...';
    // Aguardar 1.5s para o usuário ler a mensagem, depois fazer sync completo
    setTimeout(async () => {
      const screen = document.getElementById('reset-pw-screen');
      if (screen) screen.style.display = 'none';
      // Carregar perfil e dados do Supabase após trocar senha
      try {
        const user = await SBAuth.getUser();
        if (user) {
          _currentUser = user;
          const GESTORES = ['rodrigues.diegoneto@gmail.com'];
          const autoRole = GESTORES.includes(user.email) ? 'gestor' : 'vendedor';
          try {
            _currentPerfil = await SBPerfil.load(user.id);
          } catch(e) {
            const nome = user.user_metadata?.nome || user.email.split('@')[0];
            const { data } = await _sb.from('perfis').upsert({
              id: user.id, nome, role: autoRole
            }, { onConflict: 'id' }).select().single();
            if (data) _currentPerfil = data;
          }
          if (_currentPerfil) {
            localStorage.setItem('tc_vendedor_id', user.id);
            localStorage.setItem('tc_vendedor_nome', _currentPerfil.nome);
            localStorage.setItem('tc_vendedor_role', _currentPerfil.role);
          }
          hideLoginScreen();
          await syncFromSupabase();
          patchDBForSupabase();
          PendingQueue.flush().catch(() => {});
          if (typeof refreshView === 'function') refreshView();
          console.log('[Trinca 4.0] Sync completo após reset de senha');
        }
      } catch(e) {
        console.warn('[Trinca 4.0] Erro ao sincronizar após reset de senha:', e.message);
      }
    }, 1500);
  } catch(e) {
    err.style.display = 'block'; err.textContent = 'Erro: ' + e.message;
    btn.disabled = false; btn.textContent = 'Salvar nova senha';
  }
}

// Permitir Enter no input de senha
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('login-screen')?.style.display !== 'none') {
    doLogin();
  }
  if (e.key === 'Enter' && document.getElementById('reset-pw-screen')?.style.display === 'flex') {
    doUpdatePassword();
  }
});

// ═══════════════════════════════════════════════════════
// BOOTSTRAP — executa ao carregar a página
// ═══════════════════════════════════════════════════════
(async function bootstrap() {
  console.log('[Trinca 4.0] Bootstrap iniciado — navigator.locks substituído:', typeof navigator.locks.request);
  // Escutar mudanças de auth
  SBAuth.onAuthChange(async (event, session) => {
    console.log('[Trinca 4.0] onAuthStateChange:', event, session?.user?.email || 'sem user');
    // Detectar recovery de senha — mostrar tela para definir nova senha
    if (event === 'PASSWORD_RECOVERY' && session?.user) {
      _currentUser = session.user;
      showResetPasswordScreen();
      return;
    }

    if (session?.user) {
      _currentUser = session.user;
      // Determinar role: gestores pré-autorizados
      const GESTORES = ['rodrigues.diegoneto@gmail.com'];
      const userEmail = session.user.email;
      const autoRole = GESTORES.includes(userEmail) ? 'gestor' : 'vendedor';

      try {
        _currentPerfil = await SBPerfil.load(session.user.id);
        // Se é gestor pré-autorizado mas role está errado, corrigir
        if (autoRole === 'gestor' && _currentPerfil.role !== 'gestor') {
          const { error } = await _sb.from('perfis').update({ role: 'gestor' }).eq('id', session.user.id);
          if (!error) { _currentPerfil.role = 'gestor'; console.log('[Trinca 4.0] Role atualizado para gestor'); }
        }
      } catch(e) {
        // Perfil não existe — criar automaticamente
        console.warn('perfil não encontrado, criando...', e.message);
        const nome = session.user.user_metadata?.nome || userEmail.split('@')[0];
        const { data, error } = await _sb.from('perfis').upsert({
          id: session.user.id, nome, role: autoRole
        }, { onConflict: 'id' }).select().single();
        if (!error && data) { _currentPerfil = data; console.log('[Trinca 4.0] Perfil criado:', data.role); }
        else console.error('[Trinca 4.0] Falha ao criar perfil:', error?.message);
      }
      if (_currentPerfil) {
        localStorage.setItem('tc_vendedor_id', session.user.id);
        localStorage.setItem('tc_vendedor_nome', _currentPerfil.nome);
        localStorage.setItem('tc_vendedor_role', _currentPerfil.role);
      }
      hideLoginScreen();
      await syncFromSupabase();
      patchDBForSupabase();
      // Chamar init() APÓS sync para garantir que dados reais sejam renderizados
      if (typeof init === 'function' && !window._initCalled) {
        clearTimeout(window._initTimeout);
        window._initCalled = true;
        init();
      }
      // Flush pendentes — informar ao usuário
      if (PendingQueue.count > 0) {
        const _n = PendingQueue.count;
        showSyncToast('🔄 Enviando ' + _n + ' ite' + (_n > 1 ? 'ns' : 'm') + ' pendente' + (_n > 1 ? 's' : '') + '...', '#a78bfa');
      }
      PendingQueue.flush().catch(() => {});
      // Registra listeners UMA VEZ (evita duplicação a cada auth change)
      if (!window._trincaListenersRegistered) {
        window._trincaListenersRegistered = true;
        window.addEventListener('focus', () => {
          if (_currentUser) {
            PendingQueue.flush().catch(() => {});
            syncFromSupabase().then(() => { if (typeof refreshView === 'function') refreshView(); });
          }
        });
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && _currentUser) {
            PendingQueue.flush().catch(() => {});
            syncFromSupabase().then(() => { if (typeof refreshView === 'function') refreshView(); });
          }
        });
        window.addEventListener('online', () => {
          if (_currentUser) { console.log('[Trinca 4.0] Online — flushing...'); PendingQueue.flush().catch(() => {}); }
        });
      }
      // Atualiza o header com o nome do vendedor
      const brandEl = document.querySelector('.brand');
      if (brandEl && _currentPerfil) {
        const role = _currentPerfil.role === 'gestor' ? '👑' : '📋';
        brandEl.title = `${role} ${_currentPerfil.nome}`;
      }
      if (typeof refreshView === 'function') refreshView();
      if (typeof updateBadges === 'function') updateBadges();
      if (typeof calcAnalytics === 'function') calcAnalytics();
    } else {
      _currentUser  = null;
      _currentPerfil = null;
      showLoginScreen();
      // Sem sessão: init() roda para preparar a UI (sem dados de leads)
      if (typeof init === 'function' && !window._initCalled) {
        clearTimeout(window._initTimeout);
        window._initCalled = true;
        init();
      }
    }
  });

  // Verificar sessão existente — force-refresh se user já autenticado
  // (onAuthStateChange pode nunca disparar se lock estava orphaned)
  const user = await SBAuth.getUser();
  if (user) {
    console.log('[Trinca 4.0] bootstrap: user encontrado, forçando sync imediato');
    _currentUser = user;
    // Carregar perfil
    const GESTORES = ['rodrigues.diegoneto@gmail.com'];
    const autoRole = GESTORES.includes(user.email) ? 'gestor' : 'vendedor';
    try {
      _currentPerfil = await SBPerfil.load(user.id);
    } catch(e) {
      const nome = user.user_metadata?.nome || user.email.split('@')[0];
      const { data } = await _sb.from('perfis').upsert({
        id: user.id, nome, role: autoRole
      }, { onConflict: 'id' }).select().single();
      if (data) _currentPerfil = data;
    }
    if (_currentPerfil) {
      localStorage.setItem('tc_vendedor_id', user.id);
      localStorage.setItem('tc_vendedor_nome', _currentPerfil.nome);
      localStorage.setItem('tc_vendedor_role', _currentPerfil.role);
    }
    hideLoginScreen();
    await syncFromSupabase();
    patchDBForSupabase();
    // Chamar init() APÓS sync para garantir dados reais
    if (typeof init === 'function' && !window._initCalled) {
      clearTimeout(window._initTimeout);
      window._initCalled = true;
      init();
    }
    // Flush pendentes — informar ao usuário
    if (PendingQueue.count > 0) {
      const _n2 = PendingQueue.count;
      showSyncToast('🔄 Enviando ' + _n2 + ' ite' + (_n2 > 1 ? 'ns' : 'm') + ' pendente' + (_n2 > 1 ? 's' : '') + '...', '#a78bfa');
    }
    PendingQueue.flush().catch(() => {});
    if (typeof refreshView === 'function') refreshView();
    if (typeof updateBadges === 'function') updateBadges();
    if (typeof calcAnalytics === 'function') calcAnalytics();
  } else {
    showLoginScreen();
    // Sem sessão no bootstrap: garantir que init() rode
    if (typeof init === 'function' && !window._initCalled) {
      clearTimeout(window._initTimeout);
      window._initCalled = true;
      init();
    }
  }
})();

// Expor helpers globais
window.SBAuth   = SBAuth;
window.SBLeads  = SBLeads;
window._getCurrentUser  = () => _currentUser;
window._getCurrentPerfil = () => _currentPerfil;

// ─── FORCE SYNC NOW ──────────────────────────────────
async function forceSyncNow() {
  if (!_currentUser) {
    showSyncError('Faça login primeiro');
    return;
  }
  const n = PendingQueue.count;
  if (n === 0) {
    showSyncToast('Fila vazia — nada para sincronizar.', '#10b981');
    return;
  }
  showSyncToast('🔄 Enviando ' + n + ' ite' + (n > 1 ? 'ns' : 'm') + ' pendente' + (n > 1 ? 's' : '') + '...', '#a78bfa');
  try {
    await PendingQueue.flush();
    const remaining = PendingQueue.count;
    if (remaining === 0) {
      showSyncToast('✓ Tudo sincronizado!', '#10b981');
    } else {
      showSyncError(remaining + ' ite' + (remaining > 1 ? 'ns' : 'm') + ' ainda pendente' + (remaining > 1 ? 's' : '') + ' após tentativa.');
    }
  } catch (e) {
    showSyncError('Erro ao sincronizar: ' + e.message);
  }
}
window.forceSyncNow = forceSyncNow;

// ─── HELPER: Exportar leads do localStorage para console ───
// Cole no console: exportLeads()
// Ou: copy(exportLeads()) para copiar para a area de transferencia
window.exportLeads = function() {
  return localStorage.getItem('tc_leads') || '[]';
};

// ─── HELPER: Upload direto do console (sem Node) ───
// Cole no console: forceUploadAll()
window.forceUploadAll = async function() {
  const user = await SBAuth.getUser();
  if (!user) { console.error('Faca login primeiro!'); return; }
  const leads = JSON.parse(localStorage.getItem('tc_leads') || '[]');
  if (!leads.length) { console.log('Nenhum lead no localStorage.'); return; }
  console.log(`Enviando ${leads.length} leads como user ${user.id}...`);
  const rows = leads.map(l => SBLeads._toSB(l, user.id));
  const { data, error } = await _sb.from('leads').upsert(rows, { onConflict: 'id' }).select('id');
  if (error) { console.error('ERRO:', error.message); return; }
  console.log(`OK: ${data.length}/${leads.length} leads gravados no Supabase!`);
  if (data.length < leads.length) {
    console.warn(`ATENCAO: ${leads.length - data.length} leads bloqueados por RLS.`);
  }
  // Verificar
  const { data: check } = await _sb.from('leads').select('id');
  console.log(`Total no Supabase agora: ${check ? check.length : '?'} leads`);
};
