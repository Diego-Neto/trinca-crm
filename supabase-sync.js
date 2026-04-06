// ═══════════════════════════════════════════════════════
// TRINCA DA CERTEZA 4.0 — Supabase Sync Layer
// Offline-first: localStorage como cache + sync ao Supabase
// ═══════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://fzocybokxulzchhkupbj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6b2N5Ym9reHVsemNoaGt1cGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDk1OTEsImV4cCI6MjA5MDUyNTU5MX0.q2se5gYIPIuWK-s5bcPWm9NtWhpzLbl_zC1OzXrmZ7o';

// ─── INIT ────────────────────────────────────────────
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { storageKey: 'trinca-crm-auth' }
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
    const row = this._toSB(lead);
    const { error } = await _sb.from('leads').upsert(row, { onConflict: 'id' });
    if (error) console.warn('[SBLeads.upsert]', error.message);
  },

  async upsertBatch(leads) {
    if (!leads.length) return;
    const rows = leads.map(l => this._toSB(l));
    const { error } = await _sb.from('leads').upsert(rows, { onConflict: 'id' });
    if (error) console.warn('[SBLeads.upsertBatch]', error.message);
  },

  async delete(id) {
    const { error } = await _sb.from('leads').delete().eq('id', id);
    if (error) console.warn('[SBLeads.delete]', error.message);
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
    if (error) console.warn('[SBTouchlog.append]', error.message);
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
    if (error) console.warn('[SBDebriefs.upsert]', error.message);
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
    if (error) console.warn('[SBState.upsert]', error.message);
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
    if (error) console.warn('[SBTasks.upsertBatch]', error.message);
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
    if (error) console.warn('[SBConfig.save]', error.message);
  }
};

// ═══════════════════════════════════════════════════════
// SYNC ENGINE — carrega Supabase → localStorage ao iniciar
// ═══════════════════════════════════════════════════════
async function syncFromSupabase(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const leads = await SBLeads.loadAll();
      localStorage.setItem('tc_leads', JSON.stringify(leads));
      console.log(`[Trinca 4.0] ${leads.length} leads sincronizados do Supabase`);
      // Sync tasks
      try {
        const tasks = await _sb.from('tasks').select('*').order('created_at', { ascending: false });
        if (tasks.data) localStorage.setItem('tc_tasks', JSON.stringify(tasks.data.map(t => ({
          id: t.id, titulo: t.titulo, tipo: t.tipo, data: t.data,
          leadId: t.lead_id, done: t.done, createdAt: t.created_at
        }))));
      } catch(e) { console.warn('[sync tasks]', e.message); }
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

  show(state) {
    const el = this._getEl();
    if (state === 'syncing') {
      el.textContent = '🔄 Sincronizando...';
      el.style.background = 'rgba(139,92,246,0.15)'; el.style.color = '#a78bfa'; el.style.opacity = '1';
    } else if (state === 'ok') {
      el.textContent = '✓ Sincronizado';
      el.style.background = 'rgba(16,185,129,0.15)'; el.style.color = '#10b981'; el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, 2000);
    } else if (state === 'error') {
      el.textContent = '⚠ Erro no sync — dados salvos local';
      el.style.background = 'rgba(239,68,68,0.15)'; el.style.color = '#ef4444'; el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, 5000);
    }
  },

  track(promise) {
    this._pending++;
    if (this._pending === 1) this.show('syncing');
    return promise.then(r => {
      this._pending--;
      if (this._pending === 0) this.show('ok');
      return r;
    }).catch(e => {
      this._pending--;
      this._errors.push({ msg: e.message, at: new Date().toISOString() });
      if (this._errors.length > 20) this._errors.shift();
      this.show('error');
      console.warn('[Sync Error]', e.message);
    });
  }
};

// Intercepta saves do DB original e espelha no Supabase (com status visual)
function patchDBForSupabase() {
  if (DB._sbPatched) return;
  DB._sbPatched = true;
  const originalSaveLeads = DB.saveLeads.bind(DB);
  DB.saveLeads = function(leads) {
    originalSaveLeads(leads);
    SyncStatus.track(SBLeads.upsertBatch(leads));
  };

  const originalSaveDebriefs = DB.saveDebriefs.bind(DB);
  DB.saveDebriefs = function(debriefs) {
    originalSaveDebriefs(debriefs);
    const latest = debriefs[debriefs.length - 1];
    if (latest) SyncStatus.track(SBDebriefs.upsert(latest));
  };

  const originalSaveState = DB.saveState.bind(DB);
  DB.saveState = function(state) {
    originalSaveState(state);
    SyncStatus.track(SBState.upsert(state));
  };

  const originalSaveTasks = DB.saveTasks.bind(DB);
  DB.saveTasks = function(tasks) {
    originalSaveTasks(tasks);
    SyncStatus.track(SBTasks.upsertBatch(tasks));
  };

  const originalSaveConfig = DB.saveConfig.bind(DB);
  DB.saveConfig = function(config) {
    originalSaveConfig(config);
    SyncStatus.track(SBConfig.save(config));
  };

  const originalSaveTouchlog = DB.saveTouchlog.bind(DB);
  DB.saveTouchlog = function(log) {
    originalSaveTouchlog(log);
    const latest = log[log.length - 1];
    if (latest) SyncStatus.track(SBTouchlog.append(latest));
  };

  console.log('[Trinca 4.0] DB patchado — sync Supabase ativo');
}

// Expor para debug
window.SyncStatus = SyncStatus;

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
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-error');
  if (!email || !senha) { err.style.display = 'block'; err.textContent = 'Preencha e-mail e senha.'; return; }
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
  const email = document.getElementById('login-email').value.trim();
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

// Permitir Enter no input de senha
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('login-screen')?.style.display !== 'none') {
    doLogin();
  }
});

// ═══════════════════════════════════════════════════════
// BOOTSTRAP — executa ao carregar a página
// ═══════════════════════════════════════════════════════
(async function bootstrap() {
  // Escutar mudanças de auth
  SBAuth.onAuthChange(async (event, session) => {
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
      // Sync ao retornar ao app
      window.addEventListener('focus', () => { if (_currentUser) syncFromSupabase(); });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && _currentUser) syncFromSupabase();
      });
      // Atualiza o header com o nome do vendedor
      const brandEl = document.querySelector('.brand');
      if (brandEl && _currentPerfil) {
        const role = _currentPerfil.role === 'gestor' ? '👑' : '📋';
        brandEl.title = `${role} ${_currentPerfil.nome}`;
      }
      if (typeof refreshView === 'function') refreshView();
    } else {
      _currentUser  = null;
      _currentPerfil = null;
      showLoginScreen();
    }
  });

  // Verificar sessão existente
  const user = await SBAuth.getUser();
  if (!user) {
    showLoginScreen();
  }
})();

// Expor helpers globais
window.SBAuth   = SBAuth;
window.SBLeads  = SBLeads;
window._getCurrentUser  = () => _currentUser;
window._getCurrentPerfil = () => _currentPerfil;
