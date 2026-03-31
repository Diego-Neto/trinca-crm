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
      fase:        debrief.fase,
      pilar_fraco: debrief.pilarFraco,
      lead_id:     debrief.leadId || null,
      perguntas: {
        q1: debrief.q1, q2: debrief.q2, q3: debrief.q3,
        q4: debrief.q4, q5: debrief.q5, q6: debrief.q6, q7: debrief.q7,
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
      fase:        entry.fase,
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

// Intercepta saves do DB original e espelha no Supabase (fire and forget)
function patchDBForSupabase() {
  const originalSaveLeads = DB.saveLeads.bind(DB);
  DB.saveLeads = function(leads) {
    originalSaveLeads(leads);
    SBLeads.upsertBatch(leads).catch(e => console.warn('sync leads:', e.message));
  };

  const originalSaveDebriefs = DB.saveDebriefs.bind(DB);
  DB.saveDebriefs = function(debriefs) {
    originalSaveDebriefs(debriefs);
    const latest = debriefs[debriefs.length - 1];
    if (latest) SBDebriefs.upsert(latest).catch(e => console.warn('sync debrief:', e.message));
  };

  const originalSaveState = DB.saveState.bind(DB);
  DB.saveState = function(state) {
    originalSaveState(state);
    SBState.upsert(state).catch(e => console.warn('sync state:', e.message));
  };

  const originalSaveTasks = DB.saveTasks.bind(DB);
  DB.saveTasks = function(tasks) {
    originalSaveTasks(tasks);
    SBTasks.upsertBatch(tasks).catch(e => console.warn('sync tasks:', e.message));
  };

  const originalSaveConfig = DB.saveConfig.bind(DB);
  DB.saveConfig = function(config) {
    originalSaveConfig(config);
    SBConfig.save(config).catch(e => console.warn('sync config:', e.message));
  };

  const originalSaveTouchlog = DB.saveTouchlog.bind(DB);
  DB.saveTouchlog = function(log) {
    originalSaveTouchlog(log);
    const latest = log[log.length - 1];
    if (latest) SBTouchlog.append(latest).catch(e => console.warn('sync touchlog:', e.message));
  };

  console.log('[Trinca 4.0] DB patchado — sync Supabase ativo');
}

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
      try {
        _currentPerfil = await SBPerfil.load(session.user.id);
        localStorage.setItem('tc_vendedor_id', session.user.id);
        localStorage.setItem('tc_vendedor_nome', _currentPerfil.nome);
        localStorage.setItem('tc_vendedor_role', _currentPerfil.role);
      } catch(e) {
        console.warn('perfil não encontrado, criando...', e.message);
      }
      hideLoginScreen();
      await syncFromSupabase();
      patchDBForSupabase();
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
