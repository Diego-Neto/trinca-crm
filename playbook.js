// ═══════════════════════════════════════════════════
// PLAYBOOK DE CADÊNCIA — 9 Etapas × 7 ICPs
// ═══════════════════════════════════════════════════

const PB_TAG_TO_ICP = {
  'PERFIL-EMPRESARIA':'empresario','PERFIL-LIBERAL':'liberal','PERFIL-INVESTIDOR':'investidor',
  'PERFIL-SERVIDOR':'servidor','PERFIL-ASSALARIADO':'assalariado','PERFIL-HERDEIRO':'herdeiro','PERFIL-JOVEM':'jovem'
};

const PB_ICPS = {
  empresario:{nome:'Empresário/a',icon:'👔',dor:'Capital imobilizado em crédito caro corrói margem e crescimento',gatilho:'Expansão, troca de equipamento, fluxo de caixa, imóvel comercial',tip:'Fale em custo de capital e ROI. Nunca parcela.',scripts:{frio:'Sr(a) [nome], vi que você atua no setor [área]. Empresários inteligentes estão antecipando crédito sem juros para expansão — vale 15 min?',agendado:'Antes de tudo: qual é o custo médio do crédito que você usa hoje para crescer?',proposta:'O consórcio zera o juro. Para uma empresa como a sua, isso significa [economia] devolvida ao caixa por ano.'}},
  servidor:{nome:'Servidor Público',icon:'🏛️',dor:'Patrimônio travado, aposentadoria insuficiente, imóvel próprio ainda distante',gatilho:'Estabilidade salarial, prévia de aposentadoria, concurso aprovado',tip:'Estabilidade = capacidade de planejamento longo. Use isso.',scripts:{frio:'[nome], servidores com estabilidade têm um poder que a maioria não tem: planejar em 5 anos. Existe uma forma de transformar isso em patrimônio real — posso mostrar em 15 min?',agendado:'Como está seu planejamento para os próximos 5 anos? Imóvel próprio faz parte?',proposta:'Com sua estabilidade, o consórcio é previsível como seu salário — sem surpresa de juro.'}},
  liberal:{nome:'Profissional Liberal',icon:'⚕️',dor:'Renda variável dificulta planejamento, consultório/escritório em aluguel',gatilho:'Troca de carro, consultório próprio, equipamentos, investimento',tip:'Renda variável = medo de compromisso fixo. Mostre a flexibilidade.',scripts:{frio:'[nome], profissionais liberais bem-sucedidos costumam ter renda mas raramente patrimônio proporcional. Existe uma estratégia usada por médicos e advogados que resolve isso — 15 min?',agendado:'O que representa, hoje, pagar aluguel do consultório todo mês? Já calculou esse custo em 10 anos?',proposta:'Seu CRO/OAB e histórico de renda tornam isso aprovável agora — e sem juros.'}},
  assalariado:{nome:'Assalariado CLT',icon:'💼',dor:'Aluguel consome renda, sem reserva, imóvel próprio parece impossível',gatilho:'Casamento, filho nascendo, aumento salarial, FGTS acumulado',tip:'Use FGTS como ponte emocional — é dinheiro "parado" que pode trabalhar.',scripts:{frio:'[nome], você sabia que seu FGTS pode ser a entrada do seu apê sem mexer no salário? Muita gente não sabe disso — 15 min para eu mostrar?',agendado:'Qual é o valor do seu FGTS hoje? Você já pensou em usar como lance?',proposta:'Com [valor FGTS] de lance, sua parcela fica em [R$X] — menos do que você paga de aluguel.'}},
  investidor:{nome:'Investidor',icon:'📊',dor:'Busca diversificação real com retorno superior à renda fixa em cenário de queda de juros',gatilho:'Vencimento de CDB/LCI, queda da Selic, diversificação de carteira',tip:'Fale de TIR, não de parcela. Mostre como o consórcio bate a renda fixa em queda.',scripts:{frio:'[nome], com a Selic oscilando, investidores inteligentes estão alocando em consórcio como proteção patrimonial real — você conhece a tese?',agendado:'Qual é o percentual da sua carteira alocado em ativos reais hoje?',proposta:'A TIR do consórcio versus CDB em queda de Selic favorece muito quem entra agora.'}},
  herdeiro:{nome:'Herdeiro/a',icon:'🏠',dor:'Inventário travado, imóvel de herança sem liquidez, conflito familiar',gatilho:'Processo de inventário, venda de imóvel herdado, partilha',tip:'Delicado. Seja o especialista que resolve o problema familiar — não o vendedor.',scripts:{frio:'[nome], muitas famílias travam o inventário por não saber como dividir o imóvel sem vender. Existe uma saída elegante — posso explicar em 15 min?',agendado:'Como está o processo de inventário hoje? Todos os herdeiros estão alinhados?',proposta:'O consórcio pode absorver a cota do imóvel de herança, liberando cada herdeiro para usar o valor como quiser.'}},
  jovem:{nome:'Jovem Adulto',icon:'🚀',dor:'Primeiro imóvel parece distante, aluguel pesado no orçamento',gatilho:'Primeiro emprego estável, CLT com 1 ano+, relacionamento sério',tip:'Sonho > produto. Conecte ao imóvel dos sonhos, não à parcela.',scripts:{frio:'[nome], você sabia que quem começa um consórcio com 25 anos termina com o apê quitado antes dos 35? Posso te mostrar como?',agendado:'Se você pudesse ter seu próprio lugar daqui a 5 anos, como você imagina esse imóvel?',proposta:'Com sua idade, o prazo trabalha a seu favor — parcela menor, patrimônio maior no fim.'}},
};

const PB_STAGES = [
  {id:'frio',nome:'Frio',icon:'🧊',tag:'NOVO/CADÊNCIA',
   steps:['Pesquise nome + empresa no LinkedIn/Instagram','Identifique a DOR provável pelo perfil (ICP)','Mensagem de abertura: gancho externo, não produto','Aguarde 24h — máx 2 tentativas no D1'],
   cad:[0,1,1,2,4,7],
   objs:[
     {q:'Não tenho interesse',r:'Entendo — na verdade não estou vendendo nada agora. Só quero entender se faz sentido pro seu momento. 15 min?'},
     {q:'Já tenho imóvel',r:'Perfeito! Então provavelmente você tem patrimônio para trabalhar. O que eu faço é diferente — posso mostrar?'},
     {q:'Não tenho dinheiro',r:'Exatamente por isso faz sentido conversar. O consórcio é pra quem não quer gastar dinheiro em juros.'},
   ],
   crm:'DOR: [o que revelou]\nORIGEM: [como chegou]\nPRÓX AÇÃO: Mensagem D[X] em [data]',
   lo:'Simplifique a mensagem. Uma frase, um gancho. Sem sobrecarga.',
   hi:'Revise antes de enviar. Estado hipomaniaco tende a mensagens longas que assustam.'},
  {id:'sinalizou',nome:'Sinalizou',icon:'👋',tag:'SINALIZOU',
   steps:['NÃO mencione o contato anterior','Ancore na DOR que ele(a) revelou','Proponha diagnóstico de 15 min com data+hora específica','Confirme 24h antes'],
   cad:[0,1,2,4],
   objs:[
     {q:'Me manda informações por WhatsApp',r:'Claro! Mas para personalizar, preciso entender seu objetivo. São 5 min. Pode ser hoje às [hora]?'},
     {q:'Vou pensar',r:'Faz sentido. Enquanto pensa — qual é o maior obstáculo que te faz hesitar?'},
   ],
   crm:'DOR REVELADA: [exata frase dele/a]\nAGENDAMENTO: [data/hora]\nCONFIRMAÇÃO: pendente',
   lo:'Não cobre demais. Um follow-up claro, sem pressão.',
   hi:'Cuidado com entusiasmo excessivo — pode parecer desesperado. Tom neutro e consultivo.'},
  {id:'parou',nome:'Parou de Responder',icon:'🔇',tag:'CADÊNCIA TRAVADA',
   steps:['Pausa de 7 dias antes de reativar','Mude o canal (WA → ligação → e-mail)','Gancho externo novo: Selic, notícia do mercado, produto novo','Última tentativa: "Pode ter meu contato para quando fizer sentido?"'],
   cad:[7,14,21],
   objs:[
     {q:'(sem resposta)',r:'[nome], última vez — se não for o momento, tudo bem. Só me diz um "não" que eu encerro.'},
   ],
   crm:'ÚLTIMA TENTATIVA: [data]\nCANAL: [canal usado]\nDECISÃO: Geladeira em [data]',
   lo:'Não force. Preserve energia para quem está quente.',
   hi:'Não envie múltiplas mensagens no mesmo dia. Parece desespero.'},
  {id:'agendado',nome:'Diagnóstico Agendado',icon:'📅',tag:'AGUARD. DIAG.',
   steps:['Revise o CRM do lead 10 min antes','Confirme presença 24h e 2h antes','Prepare 3 perguntas SPIN baseadas no perfil ICP','Objetivo: identificar as 3 certezas — não vender ainda'],
   cad:[],
   objs:[
     {q:'Pode ser mais rápido?',r:'Sim! Vou direto ao ponto. Só preciso de 3 respostas suas para ver se faz sentido.'},
     {q:'Preciso do meu cônjuge',r:'Ótimo sinal — significa que é uma decisão importante. Posso incluir ele(a) na próxima conversa?'},
   ],
   crm:'DIAGNÓSTICO: [data/hora]\nCONFIRMEI: sim/não\nPERGUNTAS SPIN: S:[?] P:[?] I:[?] N:[?]',
   lo:'Curto e direto. Máx 20 min. Não explore tudo numa sessão baixa.',
   hi:'Não adiantou o fechamento. O diagnóstico é para ouvir, não vender.'},
  {id:'diagnostico',nome:'Diagnóstico em Andamento',icon:'🔬',tag:'EM REUNIÃO',
   steps:['S — Situação: perfil financeiro e objetivo','P — Problema: custo atual, o que trava','I — Implicação: quanto custa NÃO resolver','N — Necessidade: o lead articula o valor em voz alta'],
   cad:[],
   objs:[
     {q:'Quanto custa?',r:'Antes de responder, posso fazer uma pergunta? Qual seria o valor certo para o seu objetivo?'},
     {q:'Qual é o retorno?',r:'Depende do lance e do prazo. Me conta: você tem reserva para lance? Isso muda tudo no cálculo.'},
   ],
   crm:'SPIN COMPLETO: [respostas]\nTICKET ESTIMADO: R$[X]\nPILARES: Produto[N] Você[N] Empresa[N]\nDECISOR: sozinho/acompanhado',
   lo:'Deixe o lead falar 70% do tempo. Você escuta e toma nota.',
   hi:'Não apresente números na primeira reunião se não tiver os dados completos.'},
  {id:'proposta',nome:'Proposta Enviada',icon:'📋',tag:'PROPOSTA',
   steps:['Envie proposta personalizada com nome + sonho do lead','Marque follow-up em 48h (não 24h — deixa respirar)','Follow-up: "Qual das certezas está abaixo de 7/10 pra você?"','Nunca: "O que você achou?" — pergunta aberta demais'],
   cad:[2,5,9],
   objs:[
     {q:'Está caro',r:'Em relação a quê? Se for ao financiamento, posso mostrar a diferença. Se ao orçamento atual — qual seria o valor confortável?'},
     {q:'Vou pesquisar',r:'Faz sentido. O que exatamente você quer comparar? Posso já responder agora e poupar seu tempo.'},
     {q:'Não é o momento',r:'Entendo. Quando seria? E o que precisa mudar para ser o momento certo?'},
   ],
   crm:'PROPOSTA ENVIADA: [data]\nVALOR: R$[X] / parcela R$[Y]\nFOLLOW-UP: [data]\nCERTEZA FRACA: [pilar]',
   lo:'Follow-up objetivo. Uma pergunta só: "Qual certeza está abaixo de 7?"',
   hi:'Não pressione fechamento. Hipomaniaco negocia mal e faz promessas.'},
  {id:'negociacao',nome:'Negociação',icon:'⚖️',tag:'NEGOCIAÇÃO',
   steps:['Identifique qual das 3 certezas está abaixo de 7/10','NÃO desconte — reforce o pilar fraco','Se Produto: Big Domino (sem juros, patrimônio real)','Se Você: cases, credenciais, depoimentos','Se Empresa: BCB, 60 anos, grupo Realize'],
   cad:[1,3,7],
   objs:[
     {q:'Me dá um desconto',r:'Não tenho como mexer no produto — o que posso fazer é encontrar o plano que cabe no seu orçamento. Qual é o máximo confortável?'},
     {q:'Preciso pensar mais',r:'Com certeza. O que especificamente ainda não está claro para você?'},
     {q:'Tenho uma proposta melhor',r:'Me conta — o que eles estão oferecendo? Quero entender se é comparável.'},
   ],
   crm:'PILAR FRACO: [certeza abaixo de 7]\nARGUMENTO USADO: [qual]\nDECISOR: sozinho/cônjuge/sócio\nPRÓX: [data]',
   lo:'Uma objeção por reunião. Não tente resolver tudo de uma vez.',
   hi:'Não ceda margem por impulso. Consulte antes de qualquer concessão.'},
  {id:'fechamento',nome:'Fechamento',icon:'🏆',tag:'GANHO',
   steps:['Trial close: "Numa escala de 1-10, o quanto faz sentido?"','Se 7+: "O que falta para ser 10?" → resolve → fecha','Confirme: nome, CPF, e-mail, conta para débito','Encaminhe para assinatura digital — não deixe esfriar'],
   cad:[],
   objs:[
     {q:'Deixa eu assinar amanhã',r:'Claro! Só te peço que a gente faça o pré-cadastro agora — leva 5 min e garante o plano atual.'},
     {q:'Meu marido/esposa precisa ver',r:'Perfeito. Você consegue incluí-lo(a) numa ligação de 10 min hoje? Quero que vocês decidam juntos.'},
   ],
   crm:'FECHADO EM: [data]\nPLANO: [crédito/prazo]\nASS. DIGITAL: enviada/assinada\nCOMISSÃO: R$[X]',
   lo:'State baixo = não feche. Reagende para estado alto.',
   hi:'Revise as 3 certezas. Hipomaniaco fecha cliente errado e gera cancelamento.'},
  {id:'geladeira',nome:'Geladeira',icon:'❄️',tag:'GELADEIRA',
   steps:['Registre o motivo e o gancho para reativação futura','Programe D30/D60/D90 com gancho externo','Na reativação: NÃO mencione o passado — abordagem 100% nova','Regra: mínimo 30 dias antes de reativar'],
   cad:[30,60,90],
   objs:[
     {q:'Não quero mais',r:'Entendo perfeitamente. Só me diz — o que mudaria no futuro para fazer sentido?'},
     {q:'Mudei de ideia',r:'Tudo bem! Para eu encerrar corretamente — o que pesou mais na decisão?'},
   ],
   crm:'MOTIVO GELADEIRA: [motivo]\nGANCHO FUTURO: [o que pode mudar]\nREATIVAR EM: [data D30]',
   lo:'Aceite a geladeira sem drama. Leads bons voltam com o gancho certo.',
   hi:'Não tente reverter na hora. A energia vai assustar o lead.'},
];

function getPlaybookStage(lead) {
  const s = lead.status, f = lead.fluxo || 'FRIO';
  if (s === 'GANHO') return 'fechamento';
  if (s === 'GELADEIRA') return 'geladeira';
  if (s === 'PROPOSTA-ENVIADA') return f === 'NEGOCIACAO' ? 'negociacao' : 'proposta';
  if (s === 'AGUARDANDO-DIAGNOSTICO') return 'agendado';
  if (s === 'NUTRICAO') return 'proposta';
  if (s === 'CADENCIA-ATIVA' || s === 'NOVO') {
    if (f === 'SINALIZOU') return 'sinalizou';
    if (f === 'NEGOCIACAO') return 'negociacao';
    return 'frio';
  }
  return 'frio';
}

function getPlaybookICP(lead) {
  if (!lead.tags) return null;
  for (const tag of lead.tags) {
    if (PB_TAG_TO_ICP[tag]) return PB_TAG_TO_ICP[tag];
  }
  return null;
}

let _pbLeadId = null, _pbSi = 0, _pbIi = null;

function openPlaybook(leadId) {
  _pbLeadId = leadId;
  const lead = DB.getLeads().find(l => l.id === leadId);
  if (!lead) return;
  const stageId = getPlaybookStage(lead);
  const icpId = getPlaybookICP(lead);
  _pbSi = PB_STAGES.findIndex(s => s.id === stageId);
  if (_pbSi < 0) _pbSi = 0;
  _pbIi = icpId || null;
  const autoDetected = stageId || icpId;
  document.getElementById('pb-auto-info').style.display = autoDetected ? 'inline-flex' : 'none';
  renderPlaybookContent();
  document.getElementById('modal-playbook').classList.add('open');
}

function renderPlaybookContent() {
  const stage = PB_STAGES[_pbSi];
  const icp = _pbIi ? PB_ICPS[_pbIi] : null;
  const lead = _pbLeadId ? DB.getLeads().find(l => l.id === _pbLeadId) : null;

  // Stage tabs
  const stageTabs = PB_STAGES.map((s,i) => `<button class="pb-stab${i===_pbSi?' on':''}" onclick="_pbSi=${i};renderPlaybookContent()">${s.icon} ${s.nome}</button>`).join('');

  // ICP tabs
  const icpKeys = Object.keys(PB_ICPS);
  const icpTabs = `<button class="pb-icp${!_pbIi?' on':''}" onclick="_pbIi=null;renderPlaybookContent()">Geral</button>` +
    icpKeys.map(k => `<button class="pb-icp${_pbIi===k?' on':''}" onclick="_pbIi='${k}';renderPlaybookContent()">${PB_ICPS[k].icon} ${PB_ICPS[k].nome}</button>`).join('');

  // Script section
  const script = icp && icp.scripts[stage.id] ? `<div class="pb-sec"><div class="pb-sh on" onclick="pbToggleSec(this)"><span class="pb-shlb">💬 Script ${icp.nome}</span><span class="pb-shar">›</span></div><div class="pb-sbody on"><div class="pb-script">${icp.scripts[stage.id]}</div>${icp.tip?`<div style="font-size:10px;color:var(--yellow);margin-top:6px">💡 ${icp.tip}</div>`:''}</div></div>` : '';

  // Steps
  const stepsHtml = `<div class="pb-sec"><div class="pb-sh on" onclick="pbToggleSec(this)"><span class="pb-shlb">✅ Passos da Etapa</span><span class="pb-shar">›</span></div><div class="pb-sbody on"><ul class="pb-steps">${stage.steps.map(s=>`<li>${s}</li>`).join('')}</ul></div></div>`;

  // Objeções
  const objHtml = stage.objs.length ? `<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">🛡️ Objeções (${stage.objs.length})</span><span class="pb-shar">›</span></div><div class="pb-sbody">${stage.objs.map(o=>`<div class="pb-oc" onclick="this.classList.toggle('on')"><div class="pb-oq">${o.q}</div><div class="pb-od">${o.r}</div></div>`).join('')}</div></div>` : '';

  // CRM template
  const crmHtml = `<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">📋 Template CRM</span><span class="pb-shar">›</span></div><div class="pb-sbody"><div class="pb-crm">${stage.crm}</div></div></div>`;

  // Estado (lo/hi)
  const stateHtml = `<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">🧠 Estado Mental</span><span class="pb-shar">›</span></div><div class="pb-sbody"><div class="pb-eg"><div class="pb-ec lo"><b>⬇ Estado Baixo</b>${stage.lo}</div><div class="pb-ec hi"><b>⬆ Hipomaniaco</b>${stage.hi}</div></div></div></div>`;

  // DOR do lead
  const leadDor = lead && lead.dor ? `<div class="pb-dor">"${esc(lead.dor.slice(0,120))}"</div>` : '';
  // ICP info
  const icpInfo = icp ? `<div class="pb-dor" style="border-color:rgba(139,92,246,0.5)">🎯 ${icp.dor}</div>` : '';

  document.getElementById('playbook-content').innerHTML = `
    <div class="pb-sw"><div class="pb-stabs">${stageTabs}</div></div>
    <div class="pb-head"><span class="pb-icon">${stage.icon}</span><span class="pb-stt">${stage.nome}</span><span class="pb-tag">${stage.tag}</span></div>
    ${leadDor}
    <div class="pb-sw" style="padding:0 0 6px"><div class="pb-icps">${icpTabs}</div></div>
    ${icpInfo}
    <div class="pb-wrap">${script}${stepsHtml}${objHtml}${crmHtml}${stateHtml}</div>`;
}

function pbToggleSec(el) {
  el.classList.toggle('on');
  const body = el.nextElementSibling;
  if (body) body.classList.toggle('on');
}
