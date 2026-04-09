// ═══════════════════════════════════════════════════════════
// TRINCA CRM — Script de Diagnóstico e Recuperação
// Cole TUDO isso no console do navegador (F12 > Console)
// ═══════════════════════════════════════════════════════════

(async function trincaRecovery() {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  TRINCA CRM — DIAGNÓSTICO DE DADOS');
  console.log('══════════════════════════════════════════════');
  console.log('');

  // ─── 1. DADOS NO LOCALSTORAGE ─────────────────────────
  let localLeads = [];
  try {
    localLeads = JSON.parse(localStorage.getItem('tc_leads') || '[]');
  } catch(e) { localLeads = []; }

  console.log(`📦 localStorage (tc_leads): ${localLeads.length} leads`);
  if (localLeads.length > 0) {
    console.log('   Últimos 5 leads locais:');
    localLeads.slice(0, 5).forEach(l => {
      console.log(`   - ${l.nome || '(sem nome)'} | status: ${l.status} | fluxo: ${l.fluxo} | atualizado: ${l.ultimaAtualizacao || '?'}`);
    });
  }
  console.log('');

  // ─── 2. DADOS NO INDEXEDDB (pode ter cópia antiga) ────
  let idbLeads = [];
  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('trinca_certeza', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const val = await new Promise((resolve) => {
      const tx = db.transaction('kv', 'readonly');
      const req = tx.objectStore('kv').get('tc_leads');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
    if (val) {
      idbLeads = JSON.parse(val);
      console.log(`💾 IndexedDB (tc_leads): ${idbLeads.length} leads`);
      if (idbLeads.length > 0) {
        console.log('   Últimos 5 leads do IndexedDB:');
        idbLeads.slice(0, 5).forEach(l => {
          console.log(`   - ${l.nome || '(sem nome)'} | status: ${l.status} | fluxo: ${l.fluxo} | atualizado: ${l.ultimaAtualizacao || '?'}`);
        });
      }
    } else {
      console.log('💾 IndexedDB: sem dados de leads');
    }
  } catch(e) {
    console.log('💾 IndexedDB: não disponível ou erro -', e.message);
  }
  console.log('');

  // ─── 3. FILA PENDENTE (PendingQueue) ──────────────────
  let pending = [];
  try {
    pending = JSON.parse(localStorage.getItem('tc_pending_sync') || '[]');
  } catch(e) { pending = []; }

  console.log(`⏳ Fila pendente (tc_pending_sync): ${pending.length} operações`);
  if (pending.length > 0) {
    pending.forEach((op, i) => {
      const dataCount = Array.isArray(op.data) ? op.data.length + ' itens' : '1 item';
      console.log(`   [${i}] tipo: ${op.type} | ${dataCount} | tentativas: ${op.retries || 0} | hora: ${new Date(op.ts).toLocaleString('pt-BR')}`);
    });
  }
  console.log('');

  // ─── 4. DADOS NO SUPABASE ─────────────────────────────
  let cloudLeads = [];
  let supabaseOK = false;
  try {
    cloudLeads = await SBLeads.loadAll();
    supabaseOK = true;
    console.log(`☁️  Supabase: ${cloudLeads.length} leads`);
    if (cloudLeads.length > 0) {
      console.log('   Últimos 5 leads no Supabase:');
      cloudLeads.slice(0, 5).forEach(l => {
        console.log(`   - ${l.nome || '(sem nome)'} | status: ${l.status} | fluxo: ${l.fluxo} | atualizado: ${l.ultimaAtualizacao || '?'}`);
      });
    }
  } catch(e) {
    console.log('☁️  Supabase: ERRO ao consultar -', e.message);
    console.log('   (Você está logado? Verifique se a sessão está ativa)');
  }
  console.log('');

  // ─── 5. COMPARAÇÃO ────────────────────────────────────
  console.log('══════════════════════════════════════════════');
  console.log('  COMPARAÇÃO');
  console.log('══════════════════════════════════════════════');

  const localIds = new Set(localLeads.map(l => l.id));
  const idbIds = new Set(idbLeads.map(l => l.id));
  const cloudIds = new Set(cloudLeads.map(l => l.id));

  // Leads que estão no local mas NÃO no Supabase
  const localOnly = localLeads.filter(l => !cloudIds.has(l.id));
  // Leads que estão no IndexedDB mas NÃO no Supabase
  const idbOnly = idbLeads.filter(l => !cloudIds.has(l.id));
  // Leads que estão no Supabase mas NÃO no local
  const cloudOnly = cloudLeads.filter(l => !localIds.has(l.id));

  console.log(`  Leads SÓ no localStorage (não estão no Supabase): ${localOnly.length}`);
  localOnly.forEach(l => console.log(`    → ${l.nome} (${l.id})`));

  console.log(`  Leads SÓ no IndexedDB (não estão no Supabase):    ${idbOnly.length}`);
  idbOnly.forEach(l => console.log(`    → ${l.nome} (${l.id})`));

  console.log(`  Leads SÓ no Supabase (não estão no local):        ${cloudOnly.length}`);
  cloudOnly.forEach(l => console.log(`    → ${l.nome} (${l.id})`));

  // Verificar leads com ultimaAtualizacao mais recente no local
  const localNewer = [];
  for (const ll of localLeads) {
    const cl = cloudLeads.find(c => c.id === ll.id);
    if (cl && ll.ultimaAtualizacao && cl.ultimaAtualizacao && ll.ultimaAtualizacao > cl.ultimaAtualizacao) {
      localNewer.push(ll);
    }
  }
  if (localNewer.length > 0) {
    console.log(`  Leads MAIS RECENTES no local que no Supabase: ${localNewer.length}`);
    localNewer.forEach(l => console.log(`    → ${l.nome} | local: ${l.ultimaAtualizacao}`));
  }
  console.log('');

  // ─── 6. MELHOR FONTE PARA RECUPERAÇÃO ─────────────────
  // Se IndexedDB tem mais leads que localStorage, o sync pode ter sobrescrito
  const bestLocal = idbLeads.length > localLeads.length ? idbLeads : localLeads;
  const bestSource = idbLeads.length > localLeads.length ? 'IndexedDB' : 'localStorage';
  const leadsToSync = bestLocal.filter(l => !cloudIds.has(l.id));
  const leadsToUpdate = [];
  for (const bl of bestLocal) {
    const cl = cloudLeads.find(c => c.id === bl.id);
    if (cl && bl.ultimaAtualizacao && cl.ultimaAtualizacao && bl.ultimaAtualizacao > cl.ultimaAtualizacao) {
      leadsToUpdate.push(bl);
    }
  }

  const totalToRecover = leadsToSync.length + leadsToUpdate.length;

  if (totalToRecover === 0 && bestLocal.length <= cloudLeads.length) {
    console.log('✅ RESULTADO: Supabase parece estar em dia com os dados locais.');
    console.log('   Se você fez alterações hoje e elas sumiram, é possível que');
    console.log('   o syncFromSupabase() já tenha sobrescrito o localStorage.');
    console.log('   Nesse caso, os dados antigos do Supabase prevaleceram.');
    console.log('');
    console.log('   💡 Dica: verifique os logs acima. Se o IndexedDB tem mais');
    console.log('   leads que o localStorage, podemos tentar restaurar de lá.');
  } else {
    console.log('══════════════════════════════════════════════');
    console.log('  RECUPERAÇÃO DISPONÍVEL');
    console.log('══════════════════════════════════════════════');
    console.log(`  Fonte de dados mais completa: ${bestSource} (${bestLocal.length} leads)`);
    console.log(`  Leads novos para enviar ao Supabase: ${leadsToSync.length}`);
    console.log(`  Leads mais recentes para atualizar:  ${leadsToUpdate.length}`);
    console.log('');
    console.log('  👉 Para RECUPERAR, execute no console:');
    console.log('     trincaForceSync()');
    console.log('');

    // Disponibilizar função de recuperação
    window._trincaRecoveryData = [...leadsToSync, ...leadsToUpdate];
    window._trincaRecoverySource = bestSource;
    window._trincaRecoveryBestLocal = bestLocal;
  }

  // ─── 7. VERIFICAR SESSÃO AUTH ─────────────────────────
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  STATUS DA SESSÃO');
  console.log('══════════════════════════════════════════════');
  try {
    const user = await SBAuth.getUser();
    if (user) {
      console.log(`  ✅ Logado como: ${user.email}`);
      console.log(`  ID: ${user.id}`);
    } else {
      console.log('  ❌ NÃO LOGADO — faça login primeiro!');
    }
  } catch(e) {
    console.log('  ❌ Erro ao verificar sessão:', e.message);
  }

  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  DIAGNÓSTICO COMPLETO');
  console.log('══════════════════════════════════════════════');
  console.log('');

})();

// ─── FUNÇÃO DE RECUPERAÇÃO (chamar manualmente) ──────────

async function trincaForceSync() {
  console.log('');
  console.log('🔄 Iniciando recuperação forçada...');

  // Verificar se está logado
  const user = await SBAuth.getUser();
  if (!user) {
    console.log('❌ ERRO: Você precisa estar logado para sincronizar!');
    return;
  }

  // Usar a melhor fonte disponível
  let bestLocal = window._trincaRecoveryBestLocal;
  if (!bestLocal) {
    // Se o diagnóstico não rodou, pegar do localStorage
    try { bestLocal = JSON.parse(localStorage.getItem('tc_leads') || '[]'); }
    catch(e) { bestLocal = []; }
  }

  if (bestLocal.length === 0) {
    console.log('❌ Nenhum lead local encontrado para sincronizar.');
    return;
  }

  console.log(`📤 Enviando ${bestLocal.length} leads para o Supabase...`);
  console.log(`   (fonte: ${window._trincaRecoverySource || 'localStorage'})`);

  // Enviar em lotes de 50 para evitar timeout
  const batchSize = 50;
  let enviados = 0;
  let erros = 0;

  for (let i = 0; i < bestLocal.length; i += batchSize) {
    const batch = bestLocal.slice(i, i + batchSize);
    try {
      const rows = batch.map(lead => ({
        id:                     lead.id,
        vendedor_id:            user.id,
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
      }));

      const { error } = await _sb.from('leads').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.log(`   ❌ Erro no lote ${Math.floor(i/batchSize)+1}: ${error.message}`);
        erros += batch.length;
      } else {
        enviados += batch.length;
        console.log(`   ✅ Lote ${Math.floor(i/batchSize)+1}: ${batch.length} leads enviados`);
      }
    } catch(e) {
      console.log(`   ❌ Exceção no lote ${Math.floor(i/batchSize)+1}: ${e.message}`);
      erros += batch.length;
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log(`  RESULTADO: ${enviados} enviados, ${erros} com erro`);
  console.log('══════════════════════════════════════════════');

  if (enviados > 0) {
    // Atualizar localStorage com dados do Supabase para garantir consistência
    console.log('🔄 Sincronizando de volta do Supabase...');
    await syncFromSupabase();
    if (typeof DB !== 'undefined' && DB.invalidateCache) DB.invalidateCache();
    if (typeof refreshView === 'function') refreshView();
    console.log('✅ Tudo sincronizado! A tela deve estar atualizada.');
  }

  // Limpar fila pendente se tudo deu certo
  if (erros === 0) {
    PendingQueue.clear();
    console.log('🧹 Fila pendente limpa.');
  }

  console.log('');
}
