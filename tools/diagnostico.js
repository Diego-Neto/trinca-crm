// ═══════════════════════════════════════════════════════════
// TRINCA DA CERTEZA — SCRIPT DE DIAGNÓSTICO v1.0
// Cole INTEIRO no console do navegador (F12 > Console)
// ═══════════════════════════════════════════════════════════

(async function diagnosticoTrincaCRM() {
  const cor = {
    titulo: 'color:#a78bfa;font-size:16px;font-weight:900',
    ok:     'color:#10b981;font-weight:700',
    erro:   'color:#ef4444;font-weight:700',
    aviso:  'color:#f59e0b;font-weight:700',
    info:   'color:#60a5fa;font-weight:700',
    label:  'color:#94a3b8;font-weight:600',
  };

  console.log('%c═══ DIAGNÓSTICO TRINCA CRM ═══', cor.titulo);
  console.log('%c Versão do diagnóstico: 1.0 | Data: ' + new Date().toLocaleString('pt-BR'), cor.label);
  console.log('');

  // ─── 1. VERIFICAR USUÁRIO AUTENTICADO ───
  console.log('%c[1/7] AUTENTICAÇÃO', cor.info);
  const user = typeof _currentUser !== 'undefined' ? _currentUser : null;
  if (user) {
    console.log('%c  ✓ Usuário logado: ' + user.email, cor.ok);
    console.log('%c  ✓ User ID: ' + user.id, cor.ok);
  } else {
    console.log('%c  ✗ _currentUser é NULL — nenhum usuário logado!', cor.erro);
    console.log('%c    → Isso significa que NENHUM dado vai pro Supabase', cor.erro);
  }
  const perfil = typeof _currentPerfil !== 'undefined' ? _currentPerfil : null;
  if (perfil) {
    console.log('%c  ✓ Perfil: ' + perfil.nome + ' (' + perfil.role + ')', cor.ok);
  } else {
    console.log('%c  ✗ _currentPerfil é NULL', cor.erro);
  }
  const vendedorId = localStorage.getItem('tc_vendedor_id');
  console.log('%c  → tc_vendedor_id no localStorage: ' + (vendedorId || 'VAZIO'), vendedorId ? cor.ok : cor.erro);
  console.log('');

  // ─── 2. VERIFICAR PATCH DO DB ───
  console.log('%c[2/7] PATCH SUPABASE NO DB', cor.info);
  if (typeof DB !== 'undefined') {
    if (DB._sbPatched === true) {
      console.log('%c  ✓ DB._sbPatched = true — patch ATIVO', cor.ok);
    } else {
      console.log('%c  ✗ DB._sbPatched NÃO É true — patch NÃO está ativo!', cor.erro);
      console.log('%c    → DB.saveLeads() NÃO está enviando pro Supabase', cor.erro);
      console.log('%c    → Isso explica 100% da perda de dados', cor.erro);
    }
  } else {
    console.log('%c  ✗ DB não existe! state.js não carregou?', cor.erro);
  }
  console.log('');

  // ─── 3. LEADS NO LOCALSTORAGE ───
  console.log('%c[3/7] LEADS NO LOCALSTORAGE', cor.info);
  try {
    const leadsRaw = localStorage.getItem('tc_leads');
    if (leadsRaw) {
      const leads = JSON.parse(leadsRaw);
      console.log('%c  ✓ ' + leads.length + ' leads no localStorage', leads.length > 0 ? cor.ok : cor.aviso);
      if (leads.length > 0) {
        const statusCount = {};
        leads.forEach(l => { statusCount[l.status] = (statusCount[l.status]||0)+1; });
        console.log('%c  → Distribuição:', cor.label);
        Object.entries(statusCount).forEach(([s,c]) => console.log('    ' + s + ': ' + c));
        // Verificar se leads tem vendedor_id
        const semVendedor = leads.filter(l => !l._vendedorId && !l.vendedor_id);
        if (semVendedor.length > 0) {
          console.log('%c  ⚠ ' + semVendedor.length + ' leads SEM vendedor_id (normais se criados localmente)', cor.aviso);
        }
      }
    } else {
      console.log('%c  ✗ tc_leads NÃO EXISTE no localStorage', cor.erro);
    }
  } catch(e) {
    console.log('%c  ✗ Erro ao ler leads: ' + e.message, cor.erro);
  }
  console.log('');

  // ─── 4. TESTE DE UPSERT NO SUPABASE ───
  console.log('%c[4/7] TESTE DE ESCRITA NO SUPABASE', cor.info);
  if (typeof _sb !== 'undefined' && user) {
    try {
      const testId = 'DIAG-TEST-' + Date.now();
      const testRow = {
        id: testId,
        vendedor_id: user.id,
        nome: '__DIAGNOSTICO_TESTE__',
        status: 'NOVO',
        fluxo: 'FRIO',
        tags: [],
        ticket_estimado: 0,
        parcela_mensal: 0,
        dia_toque_atual: 0,
        tentativas_reativacao: [],
        data_criacao: new Date().toISOString().split('T')[0],
        ultima_atualizacao: new Date().toISOString().split('T')[0],
        _sync_version: 0,
      };
      const { data, error, status, statusText } = await _sb.from('leads').upsert(testRow, { onConflict: 'id' }).select();
      if (error) {
        console.log('%c  ✗ UPSERT FALHOU: ' + error.message, cor.erro);
        console.log('%c    → Código: ' + error.code + ' | Hint: ' + (error.hint||'nenhum'), cor.erro);
        if (error.message.includes('policy') || error.message.includes('RLS')) {
          console.log('%c    → CONFIRMADO: RLS está bloqueando escritas!', cor.erro);
        }
      } else if (data && data.length > 0) {
        console.log('%c  ✓ UPSERT FUNCIONOU! Lead de teste criado com sucesso', cor.ok);
        // Limpar lead de teste
        await _sb.from('leads').delete().eq('id', testId);
        console.log('%c  ✓ Lead de teste removido', cor.ok);
      } else {
        console.log('%c  ✗ UPSERT RETORNOU SUCESSO MAS 0 LINHAS ESCRITAS!', cor.erro);
        console.log('%c    → Status HTTP: ' + status + ' ' + statusText, cor.erro);
        console.log('%c    → data retornado: ' + JSON.stringify(data), cor.erro);
        console.log('%c    ════════════════════════════════════════', cor.erro);
        console.log('%c    → DIAGNÓSTICO: RLS está BLOQUEANDO silenciosamente', cor.erro);
        console.log('%c    → O Supabase diz "ok" mas não gravou nada', cor.erro);
        console.log('%c    → ESTA É A CAUSA DA PERDA DE DADOS', cor.erro);
        console.log('%c    ════════════════════════════════════════', cor.erro);
      }
    } catch(e) {
      console.log('%c  ✗ Exceção no teste: ' + e.message, cor.erro);
    }
  } else {
    console.log('%c  ⚠ Não foi possível testar (sem cliente Supabase ou sem usuário)', cor.aviso);
  }
  console.log('');

  // ─── 5. TESTE DE LEITURA NO SUPABASE ───
  console.log('%c[5/7] TESTE DE LEITURA NO SUPABASE', cor.info);
  if (typeof _sb !== 'undefined') {
    try {
      const { data, error, count } = await _sb.from('leads').select('id, nome, vendedor_id, status', { count: 'exact' });
      if (error) {
        console.log('%c  ✗ SELECT FALHOU: ' + error.message, cor.erro);
      } else {
        console.log('%c  → Query retornou: ' + (data ? data.length : 0) + ' leads', data && data.length > 0 ? cor.ok : cor.aviso);
        if (data && data.length > 0) {
          // Verificar vendedor_ids
          const vendedorIds = [...new Set(data.map(l => l.vendedor_id))];
          console.log('%c  → vendedor_ids encontrados: ' + vendedorIds.join(', '), cor.label);
          if (user && !vendedorIds.includes(user.id)) {
            console.log('%c  ⚠ Seu user.id (' + user.id + ') NÃO está nos leads retornados!', cor.aviso);
          }
          // Contar por status
          const statusCount = {};
          data.forEach(l => { statusCount[l.status] = (statusCount[l.status]||0)+1; });
          console.log('%c  → Por status no Supabase:', cor.label);
          Object.entries(statusCount).forEach(([s,c]) => console.log('    ' + s + ': ' + c));
        } else {
          console.log('%c  ✗ ZERO leads no Supabase para este usuário!', cor.erro);
          console.log('%c    → Confirma que os dados nunca chegaram ao banco', cor.erro);
        }
      }
    } catch(e) {
      console.log('%c  ✗ Exceção: ' + e.message, cor.erro);
    }
  }
  console.log('');

  // ─── 6. PENDING QUEUE ───
  console.log('%c[6/7] FILA DE PENDENTES (PendingQueue)', cor.info);
  try {
    const pending = JSON.parse(localStorage.getItem('tc_pending_sync') || '[]');
    if (pending.length === 0) {
      console.log('%c  ✓ Fila vazia — sem operações pendentes', cor.ok);
    } else {
      console.log('%c  ⚠ ' + pending.length + ' operações pendentes na fila!', cor.aviso);
      const tipos = {};
      pending.forEach(p => { tipos[p.type] = (tipos[p.type]||0)+1; });
      Object.entries(tipos).forEach(([t,c]) => console.log('    ' + t + ': ' + c));
      const oldest = pending[0];
      if (oldest && oldest.ts) {
        const age = Math.round((Date.now() - oldest.ts) / 1000 / 60);
        console.log('%c  → Operação mais antiga: ' + age + ' minutos atrás', cor.label);
      }
      // Contar retries
      const maxRetries = Math.max(...pending.map(p => p.retries || 0));
      if (maxRetries >= 3) {
        console.log('%c  ⚠ Máximo de retries: ' + maxRetries + ' — operações estão falhando repetidamente', cor.erro);
      }
    }
  } catch(e) {
    console.log('%c  ✗ Erro ao ler PendingQueue: ' + e.message, cor.erro);
  }
  console.log('');

  // ─── 7. SERVICE WORKER ───
  console.log('%c[7/7] SERVICE WORKER', cor.info);
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      console.log('%c  ✓ SW registrado — scope: ' + reg.scope, cor.ok);
      if (reg.active) {
        console.log('%c  → SW ativo: ' + (reg.active.scriptURL || 'ok'), cor.label);
      }
      if (reg.waiting) {
        console.log('%c  ⚠ SW esperando ativação — versão nova disponível!', cor.aviso);
        console.log('%c    → Execute: reg.waiting.postMessage({type:"SKIP_WAITING"})', cor.aviso);
      }
    } else {
      console.log('%c  → Sem SW registrado', cor.label);
    }
    // Verificar caches
    const cacheNames = await caches.keys();
    console.log('%c  → Caches ativos: ' + (cacheNames.join(', ') || 'nenhum'), cor.label);
    if (cacheNames.length > 1) {
      console.log('%c  ⚠ Múltiplos caches! Pode ter versão antiga:', cor.aviso);
      cacheNames.forEach(n => console.log('    - ' + n));
    }
  } else {
    console.log('%c  → Service Worker não suportado', cor.label);
  }
  console.log('');

  // ─── SESSÃO SUPABASE ───
  console.log('%c[EXTRA] SESSÃO SUPABASE', cor.info);
  try {
    const authRaw = localStorage.getItem('trinca-crm-auth');
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      if (auth.access_token) {
        // Decodificar JWT para ver expiração
        const payload = JSON.parse(atob(auth.access_token.split('.')[1]));
        const exp = new Date(payload.exp * 1000);
        const agora = new Date();
        if (exp > agora) {
          console.log('%c  ✓ Token válido até: ' + exp.toLocaleString('pt-BR'), cor.ok);
        } else {
          console.log('%c  ✗ Token EXPIRADO em: ' + exp.toLocaleString('pt-BR'), cor.erro);
          console.log('%c    → Sessão expirada pode causar falha silenciosa nos upserts', cor.erro);
        }
        console.log('%c  → Role no JWT: ' + payload.role, cor.label);
        console.log('%c  → Sub (user id): ' + payload.sub, cor.label);
      }
    } else {
      console.log('%c  ✗ Nenhuma sessão salva (trinca-crm-auth não existe)', cor.erro);
    }
  } catch(e) {
    console.log('%c  → Não foi possível ler sessão: ' + e.message, cor.aviso);
  }
  console.log('');

  // ─── RESUMO FINAL ───
  console.log('%c═══ RESUMO DO DIAGNÓSTICO ═══', cor.titulo);
  const problemas = [];
  if (!user) problemas.push('Usuário não autenticado (_currentUser null)');
  if (typeof DB !== 'undefined' && !DB._sbPatched) problemas.push('Patch do Supabase NÃO ativo (DB._sbPatched != true)');
  if (!vendedorId) problemas.push('tc_vendedor_id ausente no localStorage');

  if (problemas.length === 0) {
    console.log('%c  ✓ Configuração básica OK — se dados ainda somem, o problema é RLS no Supabase', cor.ok);
    console.log('%c  → Verifique o resultado do teste de escrita (item 4) acima', cor.aviso);
  } else {
    console.log('%c  PROBLEMAS ENCONTRADOS:', cor.erro);
    problemas.forEach((p, i) => console.log('%c  ' + (i+1) + '. ' + p, cor.erro));
  }
  console.log('');
  console.log('%c Para suporte: copie TUDO acima e envie ao desenvolvedor', cor.label);
  console.log('%c═══ FIM DO DIAGNÓSTICO ═══', cor.titulo);

})();
