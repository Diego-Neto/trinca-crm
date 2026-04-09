#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// TRINCA CRM — Upload Forçado de Leads para Supabase
// Uso: node force-upload.js
//
// Este script:
//  1. Pede email/senha interativamente
//  2. Lê leads de um arquivo JSON exportado do localStorage
//  3. Faz upsert de TODOS no Supabase
//  4. Verifica que gravou
// ═══════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SUPABASE_URL  = 'https://fzocybokxulzchhkupbj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6b2N5Ym9reHVsemNoaGt1cGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDk1OTEsImV4cCI6MjA5MDUyNTU5MX0.q2se5gYIPIuWK-s5bcPWm9NtWhpzLbl_zC1OzXrmZ7o';

// ─── Helpers ─────────────────────────────────────────────
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function toSupabaseRow(lead, vendedorId) {
  return {
    id:                     lead.id,
    vendedor_id:            vendedorId,
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
}

// ─── Main ────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('  TRINCA CRM — Upload Forçado para Supabase');
  console.log('══════════════════════════════════════════════════');
  console.log('');

  // 1. Buscar arquivo de leads
  const leadsFile = path.join(__dirname, 'leads-export.json');
  if (!fs.existsSync(leadsFile)) {
    console.log('PASSO 1: Exportar leads do navegador');
    console.log('');
    console.log('  Abra o CRM no navegador, pressione F12 (Console), e cole:');
    console.log('');
    console.log('  copy(localStorage.getItem("tc_leads"))');
    console.log('');
    console.log('  Isso copia o JSON para a area de transferencia.');
    console.log('  Depois crie o arquivo leads-export.json nesta pasta');
    console.log('  e cole o conteudo dentro dele.');
    console.log('');
    console.log('  Caminho esperado: ' + leadsFile);
    console.log('');

    const resp = await ask('Arquivo leads-export.json criado? (s/n): ');
    if (resp.toLowerCase() !== 's') {
      console.log('Abortado. Crie o arquivo e rode novamente.');
      process.exit(1);
    }
    if (!fs.existsSync(leadsFile)) {
      console.log('ERRO: Arquivo nao encontrado em ' + leadsFile);
      process.exit(1);
    }
  }

  let leads;
  try {
    const raw = fs.readFileSync(leadsFile, 'utf-8');
    leads = JSON.parse(raw);
    if (!Array.isArray(leads)) {
      console.log('ERRO: O arquivo deve conter um array JSON de leads.');
      process.exit(1);
    }
  } catch(e) {
    console.log('ERRO ao ler leads-export.json:', e.message);
    process.exit(1);
  }

  console.log(`Encontrados ${leads.length} leads no arquivo.`);
  if (leads.length === 0) {
    console.log('Nenhum lead para enviar.');
    process.exit(0);
  }

  // Mostrar preview
  console.log('');
  console.log('Preview dos primeiros 5:');
  leads.slice(0, 5).forEach(l => {
    console.log(`  - ${l.nome || '(sem nome)'} | ${l.status} | ${l.fluxo} | atualizado: ${l.ultimaAtualizacao || '?'}`);
  });
  console.log('');

  // 2. Login
  const email = await ask('Email do Supabase: ');
  const senha = await ask('Senha: ');

  console.log('');
  console.log('Fazendo login...');

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data: authData, error: authError } = await sb.auth.signInWithPassword({ email, password: senha });

  if (authError) {
    console.log('ERRO DE LOGIN:', authError.message);
    process.exit(1);
  }

  const user = authData.user;
  console.log(`Logado como: ${user.email} (ID: ${user.id})`);
  console.log('');

  // 3. Upsert em lotes
  const batchSize = 50;
  let totalEnviados = 0;
  let totalErros = 0;

  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    const rows = batch.map(l => toSupabaseRow(l, user.id));

    const { data, error } = await sb.from('leads').upsert(rows, { onConflict: 'id' }).select('id');
    if (error) {
      console.log(`  ERRO lote ${Math.floor(i/batchSize)+1}: ${error.message}`);
      totalErros += batch.length;
    } else {
      const gravados = data ? data.length : 0;
      totalEnviados += gravados;
      console.log(`  Lote ${Math.floor(i/batchSize)+1}: ${gravados}/${batch.length} leads gravados`);
      if (gravados < batch.length) {
        console.log(`    ATENCAO: ${batch.length - gravados} leads bloqueados (RLS?)`);
        totalErros += (batch.length - gravados);
      }
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log(`  RESULTADO: ${totalEnviados} enviados, ${totalErros} com erro`);
  console.log('══════════════════════════════════════════════════');

  // 4. Verificação
  console.log('');
  console.log('Verificando dados no Supabase...');
  const { data: check, error: checkErr } = await sb.from('leads').select('id, nome, status').order('ultima_atualizacao', { ascending: false });

  if (checkErr) {
    console.log('Erro na verificacao:', checkErr.message);
  } else {
    console.log(`Total de leads no Supabase agora: ${check.length}`);
    console.log('');
    console.log('Ultimos 10:');
    check.slice(0, 10).forEach(l => {
      console.log(`  - ${l.nome} | ${l.status}`);
    });
  }

  // 5. Logout
  await sb.auth.signOut();
  console.log('');
  console.log('Sessao encerrada. Upload completo!');
  console.log('');
}

main().catch(e => { console.error('Erro fatal:', e.message); process.exit(1); });
