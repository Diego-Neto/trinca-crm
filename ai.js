// ═══════════════════════════════════════════════════
// AI ENGINE
// ═══════════════════════════════════════════════════
function getAIKey() { return localStorage.getItem('trinca-ai-key') || ''; }

function showToast(msg, duration) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), duration || 3000);
}

function configAI() {
  const current = getAIKey();
  const provider = current ? (current.startsWith('sk-or-') ? 'OpenRouter' : current.startsWith('sk-ant-') ? 'Anthropic' : 'StepFun') : '';
  document.getElementById('modal-ai-title').textContent = '🤖 Configurar IA';
  document.getElementById('modal-ai-body').innerHTML = `
    <p style="color:var(--muted2);font-size:12px;margin-bottom:10px">Cole sua chave de IA para ativar os recursos de inteligência artificial.</p>
    <p style="color:var(--muted2);font-size:11px;margin-bottom:12px;line-height:1.6">
      <b style="color:var(--text)">OpenRouter</b> → começa com <code style="background:var(--bg3);padding:1px 5px;border-radius:4px">sk-or-</code><br>
      <b style="color:var(--text)">Anthropic</b> → começa com <code style="background:var(--bg3);padding:1px 5px;border-radius:4px">sk-ant-</code><br>
      <b style="color:var(--text)">StepFun</b> → qualquer outro formato
    </p>
    ${current ? `<p style="font-size:11px;color:var(--green);margin-bottom:10px">✓ Chave atual: <b>${provider}</b> configurada</p>` : ''}
    <input id="ai-key-input" type="password" placeholder="Cole sua chave aqui..."
      style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;
             padding:10px;color:var(--text);font-size:13px;outline:none;margin-bottom:10px;box-sizing:border-box">
    <button class="btn-primary" style="width:100%;padding:10px;border-radius:8px;border:none;
            background:var(--purple);color:#fff;font-size:13px;font-weight:700;cursor:pointer"
      onclick="saveAIKey()">Salvar Chave</button>
    ${current ? `<button class="btn-sec" style="width:100%;margin-top:6px;padding:9px;border-radius:8px;
            border:1px solid var(--border2);background:none;color:var(--muted2);font-size:12px;cursor:pointer"
      onclick="saveAIKey('')">Remover Chave</button>` : ''}
  `;
  document.getElementById('modal-ai').classList.add('open');
  setTimeout(() => document.getElementById('ai-key-input')?.focus(), 100);
}

function saveAIKey(keyOverride) {
  const key = keyOverride !== undefined ? keyOverride : (document.getElementById('ai-key-input')?.value?.trim() || '');
  localStorage.setItem('trinca-ai-key', key);
  closeModal('modal-ai');
  if (key) {
    const provider = key.startsWith('sk-or-') ? 'OpenRouter' : key.startsWith('sk-ant-') ? 'Anthropic' : 'StepFun';
    showToast('✓ Chave ' + provider + ' salva! IA ativada.');
  } else {
    showToast('Chave de IA removida.');
  }
}

const OR_FREE_MODELS = [
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
];

async function callAI(systemPrompt, userMsg) {
  const key = getAIKey();
  if (!key) { configAI(); return null; }
  try {
    let res, data;
    if (key.startsWith('sk-or-')) {
      // OpenRouter — tenta modelos gratuitos em cascata
      let lastErr = 'Nenhum modelo disponível';
      for (const model of OR_FREE_MODELS) {
        res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+key,'HTTP-Referer':'trinca-dashboard','X-Title':'Trinca CRM'},
          body:JSON.stringify({model,max_tokens:600,messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}]})
        });
        data = await res.json();
        if (data.error) { lastErr = data.error.message||'Erro OpenRouter'; continue; }
        const msg = data.choices?.[0]?.message;
        const text = (msg?.content||msg?.reasoning_content||'').trim();
        if (text) return text;
      }
      throw new Error(lastErr);
    } else if (key.startsWith('sk-ant-')) {
      // Anthropic
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:600,system:systemPrompt,messages:[{role:'user',content:userMsg}]})
      });
      data = await res.json();
      if (data.error) throw new Error(data.error.message||'Erro Anthropic');
      return data.content?.[0]?.text?.trim()||null;
    } else {
      // StepFun (OpenAI-compatible)
      res = await fetch('https://api.stepfun.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:'step-1-8k',max_tokens:600,messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}]})
      });
      data = await res.json();
      if (data.error) throw new Error(data.error.message||'Erro StepFun');
      const msg = data.choices?.[0]?.message;
      return (msg?.content||'').trim()||null;
    }
  } catch(e) { return '❌ Erro: '+e.message; }
}

function showAIModal(title, content) {
  document.getElementById('modal-ai-title').textContent = title;
  const safe = (content||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  document.getElementById('modal-ai-body').innerHTML = `
    <div class="ai-result-box" style="margin-bottom:12px">${safe}</div>
    <button class="btn-primary" style="width:100%" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('.ai-result-box').innerText);this.textContent='Copiado!'">Copiar texto</button>
  `;
  document.getElementById('modal-ai').classList.add('open');
}

function setAILoading(btn, loading) {
  if (loading) { btn.disabled=true; btn.dataset.orig=btn.textContent; btn.textContent='Gerando...'; }
  else { btn.disabled=false; btn.textContent=btn.dataset.orig||btn.textContent; }
}

// Injection #1 — Gerar Mensagem (Cadência)
async function gerarMensagem(leadId) {
  if (!getAIKey()) { configAI(); return; }
  const lead = DB.getLeads().find(l=>l.id===leadId);
  if (!lead) return;
  const btn = event.currentTarget||event.target;
  setAILoading(btn, true);
  const toque = (lead.toqueNoStage||lead.diaToqueAtual||0)+1;
  // Buscar dados do playbook se disponível
  const pbStageId = typeof getPlaybookStage === 'function' ? getPlaybookStage(lead) : null;
  const pbIcpId = typeof getPlaybookICP === 'function' ? getPlaybookICP(lead) : null;
  const pbStageIdx = pbStageId && typeof PB_STAGES !== 'undefined' ? PB_STAGES.findIndex(function(s){return s.id===pbStageId;}) : -1;
  const pbStage = pbStageIdx >= 0 ? PB_STAGES[pbStageIdx] : null;
  const pbCad = pbStage && pbStage.cad ? pbStage.cad[Math.min(lead.toqueNoStage||0, pbStage.cad.length-1)] : null;
  // Canal: do playbook se disponível, senão fallback genérico
  let canal;
  if (pbCad && pbCad.l) {
    canal = pbCad.l.match(/liga/i) ? 'LIGACAO' : pbCad.l.match(/instagram/i) ? 'INSTAGRAM' : 'WHATSAPP';
  } else {
    canal = CADENCE_CANALS[Math.min(toque,CADENCE_CANALS.length-1)]||'WHATSAPP';
  }
  // Script de referência do playbook
  const pbScript = pbStage && pbIcpId && pbStage.scripts && pbStage.scripts[pbIcpId] ? pbStage.scripts[pbIcpId] : '';
  const pbObjs = pbStage && pbStage.objs ? pbStage.objs.map(function(o){return o.q+' → '+o.s;}).join('; ') : '';
  const msgLog = DB.getMsgLog(leadId);
  const histStr = msgLog.length > 0
    ? '\nMENSAGENS JÁ ENVIADAS (não repita estas abordagens):\n' + msgLog.map((m,i)=>`${i+1}. [${m.data}] ${m.texto.slice(0,100)}`).join('\n')
    : '';
  const system = `Você é Dan Kennedy + Joseph Sugarman criando mensagem de ${CANAL_LABELS[canal]||canal} para consórcio Realize.
Regras absolutas:
- Ancora EXCLUSIVAMENTE na DOR e no SONHO informados — nunca invente contexto
- Urgência real baseada no estágio do lead, não em promoção falsa
- Uma única call-to-action no final
- Máximo 4 linhas para WhatsApp, 6 para outros canais
- NÃO repita abordagens anteriores listadas no histórico
- Use o script de referência como BASE mas personalize com os dados do lead
- Responda APENAS com o texto pronto. Sem prefácio, sem aspas.`;
  const memCtx = buildLeadContext(leadId);
  const stageCtx = pbStage ? `\nETAPA DO FUNIL: ${pbStage.nome} — ${pbStage.desc||''}` : '';
  const scriptCtx = pbScript ? `\nSCRIPT DE REFERÊNCIA (adapte, não copie literal): ${pbScript}` : '';
  const objCtx = pbObjs ? `\nOBJEÇÕES PROVÁVEIS NESTA ETAPA: ${pbObjs}` : '';
  const cadCtx = pbCad ? `\nAÇÃO ESPERADA: ${pbCad.d} — ${pbCad.l}: ${pbCad.a}` : '';
  const user = `Lead: ${lead.nome} | Status: ${STATUS_LABELS[lead.status]} | Toque #${toque} via ${CANAL_LABELS[canal]||canal}
DOR: ${lead.dor||'⚠ não informada'}
SONHO: ${lead.sonho||'não informado'}
OBJEÇÃO JÁ LEVANTADA: ${lead.objecaoPrincipal||'nenhuma registrada'}
Próxima ação: ${lead.proximaAcao||'não definida'}
Perfil: ${(lead.tags||[]).map(t=>TAG_SHORT[t]||t).join(', ')||'não informado'}
Crédito: R$ ${(lead.ticketEstimado||100000).toLocaleString('pt-BR')} | Fluxo: ${lead.fluxo||'FRIO'}${stageCtx}${scriptCtx}${cadCtx}${objCtx}${histStr}${memCtx}
Gere a mensagem.`;
  const result = await callAI(system, user);
  setAILoading(btn, false);
  if (result) {
    const log = DB.getMsgLog(leadId);
    log.push({ data: today(), toque, canal, texto: result });
    DB.saveMsgLog(leadId, log);
    showAIModal('Mensagem IA — '+lead.nome, result);
  }
}

// Injection #2 — Diagnóstico Trinca da Certeza
async function diagnosticoTrinca(leadId) {
  if (!getAIKey()) { configAI(); return; }
  const lead = DB.getLeads().find(l=>l.id===leadId);
  if (!lead) return;
  const btn = event.currentTarget||event.target;
  setAILoading(btn, true);
  const system = `Você é Myron Golden + Jordan Belfort analisando um lead via Trinca da Certeza (Straight Line).
As 3 certezas: 1) Produto/Ferramenta, 2) Consultor/Você, 3) Empresa/Realize.
Diagnostique qual certeza está abaixo de 7/10 e entregue: diagnóstico cirúrgico + script exato de follow-up.
Máximo 5 parágrafos. Direto, sem rodeios.`;
  const memCtx2 = buildLeadContext(leadId);
  const user = `Lead: ${lead.nome} | DOR: ${lead.dor||'⚠ não informada'}
SONHO: ${lead.sonho||'não informado'}
OBJEÇÃO PRINCIPAL JÁ LEVANTADA: ${lead.objecaoPrincipal||'nenhuma registrada'}
Pilar fraco identificado: ${lead.pilarFraco||'nenhum'} | Crédito: R$ ${(lead.ticketEstimado||100000).toLocaleString('pt-BR')}
Perfil: ${(lead.tags||[]).map(t=>TAG_SHORT[t]||t).join(', ')} | Notas: ${lead.notas||'(sem notas)'}
Próxima ação: ${lead.proximaAcao||'não definida'}${memCtx2}
Diagnóstico das 3 certezas + script cirúrgico de follow-up para fechar.`;
  const result = await callAI(system, user);
  setAILoading(btn, false);
  if (result) showAIModal('Diagnóstico Trinca — '+lead.nome, result);
}

// Injection #3 — Analisar Pipeline
async function analisarPipeline() {
  if (!getAIKey()) { configAI(); return; }
  const btn = event.currentTarget||event.target;
  setAILoading(btn, true);
  const leads = DB.getLeads();
  const byStatus = {};
  STATUSES.forEach(s=>{ byStatus[s]=leads.filter(l=>l.status===s).length; });
  const meta = parseInt(document.getElementById('meta-contratos')?.value)||5;
  const system = `Você é Patrick Bet-David analisando um funil de vendas de consórcio.
Identifique os 3 maiores gargalos de conversão, calcule o gap para a meta e dê 3 ações específicas para os próximos 7 dias.
Formato: Diagnóstico → 3 Gargalos → 3 Ações. Linguagem direta, sem rodeios.`;
  const anlt = DB.getAnalytics();
  const icpTop = Object.entries(anlt.porICP||{}).filter(([,s])=>s.total>=2).sort(([,a],[,b])=>b.ganhos/b.total-a.ganhos/a.total).slice(0,3).map(([tag,s])=>`${TAG_SHORT[tag]||tag}: ${Math.round(s.ganhos/s.total*100)}%`).join(', ');
  const canalTop = Object.entries(anlt.porCanal||{}).filter(([,s])=>s.total>=3).sort(([,a],[,b])=>b.positivos/b.total-a.positivos/a.total).slice(0,2).map(([c,s])=>`${c}: ${Math.round(s.positivos/s.total*100)}%`).join(', ');
  const user = `Pipeline atual:\n${Object.entries(byStatus).filter(([,v])=>v>0).map(([k,v])=>`${STATUS_LABELS[k]}: ${v} leads`).join('\n')}
Meta do mês: ${meta} contratos | Ganhos: ${byStatus['GANHO']||0}
${icpTop?`ICPs com maior taxa de conversão histórica: ${icpTop}`:''}
${canalTop?`Canais mais efetivos: ${canalTop}`:''}
Analise os gargalos e entregue 3 ações para bater a meta.`;
  const result = await callAI(system, user);
  setAILoading(btn, false);
  if (result) {
    const el = document.getElementById('pipeline-ai-result');
    const safe = (result||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    el.style.display='block';
    el.innerHTML = `<div class="ai-result-box">${safe}</div>`;
  }
}

// Injection #4 — Anti-Objeção
async function gerarAntiObjecao() {
  if (!getAIKey()) { configAI(); return; }
  const objecao = document.getElementById('objecao-input')?.value?.trim();
  if (!objecao) { alert('Cole a objeção do lead no campo acima'); return; }
  const btn = event.currentTarget||event.target;
  setAILoading(btn, true);
  const system = `Você é Robert Cialdini + Dan Ariely + Gary Halbert — trio de persuasão aplicado a consórcio.
Para cada objeção entregue:
1. O mecanismo psicológico da objeção
2. O princípio de Cialdini que neutraliza
3. Script exato de resposta (curto, conversacional)
Contexto: consórcio Realize, sem juros, crédito R$80k-300k.`;
  const user = `Objeção: "${objecao}"\nDiagnóstico + script de neutralização.`;
  const result = await callAI(system, user);
  setAILoading(btn, false);
  const el = document.getElementById('objecao-ai-result');
  if (el && result) {
    const safe = (result||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    el.style.display='block';
    el.innerHTML = `<div class="ai-result-box">${safe}</div>`;
  }
}

// Injection #5 — Pitch Personalizado
async function gerarPitchPersonalizado(leadId) {
  if (!getAIKey()) { configAI(); return; }
  const btn = event.currentTarget||event.target;
  setAILoading(btn, true);
  let lead = null;
  if (leadId && leadId !== '__NEW__') lead = DB.getLeads().find(l=>l.id===leadId);
  const nome = lead?.nome || document.getElementById('fl-nome')?.value || '(novo lead)';
  const dor = lead?.dor || document.getElementById('fl-dor')?.value || '';
  const tags = lead?.tags || Array.from(document.querySelectorAll('input[name="tags"]:checked')).map(c=>c.value);
  const ticket = lead?.ticketEstimado || parseInt(document.getElementById('fl-ticket')?.value)||100000;
  const pilar = lead?.pilarFraco || document.getElementById('fl-pilar')?.value || '';
  const notas = lead?.notas || document.getElementById('fl-notas')?.value || '';
  const sonho = lead?.sonho || document.getElementById('fl-sonho')?.value || '';
  const objecao = lead?.objecaoPrincipal || document.getElementById('fl-objecao')?.value || '';
  const system = `Você é April Dunford + Donald Miller criando pitch de vendas para consórcio Realize.
April Dunford: posiciona por contraste real (consórcio vs financiamento vs poupança) usando os números do lead.
Donald Miller (StoryBrand): lead é o herói, o consórcio é a ferramenta, você é o guia.
Estrutura obrigatória: PROBLEMA (dor real) → SOLUÇÃO (consórcio como caminho para o sonho) → VISÃO (vida após conquistar o sonho).
Se houver objeção registrada, neutralize ela sutilmente na SOLUÇÃO.
Pitch conversacional, máximo 4 parágrafos. Pronto para falar, não para ler.`;
  const memCtx5 = buildLeadContext(leadId);
  const user = `Lead: ${nome}
DOR: ${dor||'⚠ não informada'}
SONHO: ${sonho||'não informado'}
OBJEÇÃO JÁ LEVANTADA: ${objecao||'nenhuma'}
Perfil: ${tags.map(t=>TAG_SHORT[t]||t).join(', ')||'não informado'}
Crédito: R$ ${ticket.toLocaleString('pt-BR')} | Pilar fraco: ${pilar||'nenhum'}
Notas: ${notas||'(sem notas)'}${memCtx5}
Gere o pitch personalizado.`;
  const result = await callAI(system, user);
  setAILoading(btn, false);
  if (result) showAIModal('Pitch Personalizado — '+nome, result);
}

// Injection #6 — Preparar SPIN Selling (Neil Rackham)
async function prepararSPIN(leadId) {
  if (!getAIKey()) { configAI(); return; }
  var lead = DB.getLeads().find(function(l){return l.id===leadId;});
  if (!lead) return;
  var btn = event.currentTarget||event.target;
  setAILoading(btn, true);

  var icpId = typeof getPlaybookICP === 'function' ? getPlaybookICP(lead) : null;
  var icp = icpId && typeof PB_ICPS !== 'undefined' ? PB_ICPS[icpId] : null;
  var stageId = typeof getPlaybookStage === 'function' ? getPlaybookStage(lead) : null;
  var pbStageIdx = stageId && typeof PB_STAGES !== 'undefined' ? PB_STAGES.findIndex(function(s){return s.id===stageId;}) : -1;
  var pbStage = pbStageIdx >= 0 ? PB_STAGES[pbStageIdx] : null;

  var system = 'Voce e Neil Rackham, criador do SPIN Selling (35.000 vendas estudadas em 23 paises).\n'+
    'Gere um roteiro SPIN personalizado para este lead de consorcio da Realize Consorcios.\n\n'+
    'REGRAS:\n'+
    '- Gere EXATAMENTE 2 perguntas por categoria (S, P, I, N) = 8 perguntas total\n'+
    '- Perguntas devem parecer CONVERSA NATURAL, nunca interrogatorio\n'+
    '- Use dados reais do lead (DOR, ICP, ticket, objecao) nas perguntas\n'+
    '- S (Situacao): coletar contexto (como/qual/quem/quando)\n'+
    '- P (Problema): identificar dificuldades e insatisfacoes\n'+
    '- I (Implicacao): ampliar consequencias de nao agir (custo da inacao em R$, 6 meses, 12 meses)\n'+
    '- N (Necessidade): levar o lead a expressar o valor da solucao\n'+
    '- Inclua uma DICA DE TRANSICAO entre cada etapa (como mudar de S pra P naturalmente)\n'+
    '- Termine com FRASE DE FECHAMENTO sugerida apos a etapa N\n\n'+
    'FORMATO:\n'+
    'S — SITUACAO\n1. [pergunta]\n2. [pergunta]\nTransicao: [como migrar pra P]\n\n'+
    'P — PROBLEMA\n1. [pergunta]\n2. [pergunta]\nTransicao: [como migrar pra I]\n\n'+
    'I — IMPLICACAO\n1. [pergunta]\n2. [pergunta]\nTransicao: [como migrar pra N]\n\n'+
    'N — NECESSIDADE\n1. [pergunta]\n2. [pergunta]\n\n'+
    'FECHAMENTO: [frase sugerida]\n\n'+
    'CONTEXTO DO PRODUTO:\n'+
    '- Consorcio = alavancagem patrimonial sem juros (nao e compra parcelada)\n'+
    '- Vs financiamento bancario: 167% de custo total vs 12% do consorcio\n'+
    '- Regulado pelo Banco Central do Brasil\n'+
    '- FGTS pode ser usado como lance\n'+
    '- Realize Consorcios: solidez e historico';

  var memCtx = typeof buildLeadContext === 'function' ? buildLeadContext(leadId) : '';
  var user = 'Lead: ' + lead.nome + '\n'+
    'DOR: ' + (lead.dor||'nao informada') + '\n'+
    'SONHO: ' + (lead.sonho||'nao informado') + '\n'+
    'OBJECAO JA LEVANTADA: ' + (lead.objecaoPrincipal||'nenhuma') + '\n'+
    'Perfil ICP: ' + (icp ? icp.nome + ' — ' + icp.dor : (lead.tags||[]).map(function(t){return TAG_SHORT[t]||t;}).join(', ')||'nao informado') + '\n'+
    'Credito estimado: R$ ' + (lead.ticketEstimado||100000).toLocaleString('pt-BR') + '\n'+
    'Status: ' + (STATUS_LABELS[lead.status]||lead.status) + '\n'+
    'Pilar fraco: ' + (lead.pilarFraco||'nenhum identificado') + '\n'+
    'Notas: ' + (lead.notas||'sem notas') + '\n'+
    (pbStage ? 'Etapa do funil: ' + pbStage.nome + ' — ' + (pbStage.desc||'') + '\n' : '') +
    memCtx + '\n'+
    'Gere o roteiro SPIN personalizado para este lead.';

  var result = await callAI(system, user);
  setAILoading(btn, false);
  if (result) showAIModal('SPIN Selling — ' + lead.nome, result);
}
