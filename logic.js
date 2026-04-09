// ═══════════════════════════════════════════════════
// TRINCA DA CERTEZA 4.0 — Pure Business Logic
// Funções sem dependência de DOM — testáveis com Jest
// ═══════════════════════════════════════════════════

function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'});
}

function daysDiff(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate + 'T00:00:00');
  const t = new Date();
  t.setHours(0,0,0,0);
  return Math.floor((d - t) / 86400000);
}

var CADENCE_DAYS = [0,1,1,2,4,7,9,12,30];

function calcNextTouch(lead) {
  const dia = lead.diaToqueAtual;
  if (!lead.dataCriacao || dia == null || isNaN(dia) || dia >= CADENCE_DAYS.length - 1) return null;
  const next = dia + 1;
  if (CADENCE_DAYS[next] === undefined) return null;
  const d = new Date(lead.dataCriacao + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + CADENCE_DAYS[next]);
  // Garantir que próximo toque nunca caia no passado — mínimo amanhã
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);
  if (d < tomorrow) d.setTime(tomorrow.getTime());
  return d.toISOString().split('T')[0];
}

function getPhase(humor, energia) {
  if (humor <= 4 && energia >= 7) return 'misto';
  if (humor <= 3 && energia >= 5) return 'misto';
  if (humor <= 3 || energia <= 2) return 'depressao';
  if (humor >= 8 && energia >= 8) return 'hipomaniaco';
  if (humor <= 5 || energia <= 4) return 'funcional';
  return 'verde';
}

function getPriority(lead) {
  if (lead.status === 'GANHO' || lead.status === 'PERDIDO' || lead.status === 'GELADEIRA') return 'C';
  if (lead.status === 'AGUARDANDO-DIAGNOSTICO') {
    const diff = daysDiff(lead.dataHoraDiagnostico);
    if (diff !== null && diff <= 0) return 'A';
    return 'B';
  }
  if (lead.status === 'PROPOSTA-ENVIADA') {
    const diff = daysDiff(lead.ultimaAtualizacao);
    if (diff !== null && diff <= -1) return 'A';
    return 'B';
  }
  if (lead.status === 'CADENCIA-ATIVA' || lead.status === 'NOVO') {
    const nt = lead.proximoToque || calcNextTouch(lead);
    if (!nt) return 'C';
    const diff = daysDiff(nt);
    if (diff !== null && diff <= 0) return 'A';
    if (diff !== null && diff <= 2) return 'B';
    return 'C';
  }
  if (lead.status === 'NUTRICAO') {
    const diff = daysDiff(lead.dataRetornoNutricao);
    if (diff !== null && diff <= 2) return 'B';
    return 'C';
  }
  return 'C';
}

var STATUS_FLOW_ALLOWED = {
  'NOVO':['CADENCIA-ATIVA','NUTRICAO','PERDIDO'],
  'CADENCIA-ATIVA':['AGUARDANDO-DIAGNOSTICO','NUTRICAO','PERDIDO','GELADEIRA'],
  'AGUARDANDO-DIAGNOSTICO':['PROPOSTA-ENVIADA','CADENCIA-ATIVA','PERDIDO','NUTRICAO'],
  'PROPOSTA-ENVIADA':['GANHO','CADENCIA-ATIVA','PERDIDO','NUTRICAO','GELADEIRA'],
  'NUTRICAO':['CADENCIA-ATIVA','GELADEIRA','PERDIDO'],
  'GELADEIRA':['CADENCIA-ATIVA','PERDIDO'],
  'GANHO':[],'PERDIDO':['CADENCIA-ATIVA'],
};

var STATUS_LABELS = {
  'NOVO':'Novo','CADENCIA-ATIVA':'Cadência Ativa',
  'AGUARDANDO-DIAGNOSTICO':'Aguardando Diagnóstico','PROPOSTA-ENVIADA':'Proposta Enviada',
  'NUTRICAO':'Nutrição','GANHO':'Ganho','PERDIDO':'Perdido','GELADEIRA':'Geladeira'
};

function canAdvanceStatus(lead, newStatus, motivo) {
  const allowed = STATUS_FLOW_ALLOWED[lead.status] || [];
  if (!allowed.includes(newStatus)) {
    const nextOk = allowed.map(s=>STATUS_LABELS[s]||s).join(', ') || '—';
    return {ok:false, error:`Fluxo bloqueado: "${STATUS_LABELS[lead.status]}" → "${STATUS_LABELS[newStatus]}" não é permitido. Próximos válidos: ${nextOk}`};
  }
  if (newStatus === 'PROPOSTA-ENVIADA' && !lead.dataHoraDiagnostico) {
    return {ok:false, error:'Não há data de diagnóstico registrada. Agende o diagnóstico antes de enviar proposta.'};
  }
  if (newStatus === 'GANHO' && (!lead.dor || !lead.proximaAcao)) {
    return {ok:false, error:'Para marcar como Ganho, preencha: DOR do lead + Próxima ação no cadastro.'};
  }
  if (lead.status === 'PERDIDO' && newStatus === 'CADENCIA-ATIVA' && !motivo) {
    return {ok:false, error:'Informe o motivo da reativação para mover de Perdido → Cadência Ativa.'};
  }
  // CHAMP gate: bloqueia DIAGNOSTICO se score < 4
  if (newStatus === 'AGUARDANDO-DIAGNOSTICO') {
    var score = calcChampScore(lead);
    if (score < 4) {
      return {ok:false, error:'Score CHAMP insuficiente ('+score+'/12). Mínimo 4 para agendar diagnóstico. Preencha a qualificação CHAMP no cadastro do lead.'};
    }
  }
  return {ok:true};
}

// ═══════════════════════════════════════════════════
// CHAMP Scoring (0-12)
// C = Challenges (0-3), H = Authority (0-3),
// A = Money (0-3), M = Prioritization (0-3)
// ═══════════════════════════════════════════════════
function calcChampScore(lead) {
  return (parseInt(lead.champC)||0) + (parseInt(lead.champH)||0) +
         (parseInt(lead.champA)||0) + (parseInt(lead.champM)||0);
}

var STAGE_PROBABILITY = {
  'NOVO':5,'CADENCIA-ATIVA':15,'AGUARDANDO-DIAGNOSTICO':35,
  'PROPOSTA-ENVIADA':60,'NUTRICAO':10,'GELADEIRA':5,'GANHO':100,'PERDIDO':0
};
var STAGE_FORECAST = {
  'NOVO':'PIPELINE','CADENCIA-ATIVA':'PIPELINE','AGUARDANDO-DIAGNOSTICO':'PIPELINE',
  'PROPOSTA-ENVIADA':'COMPROMETIDO','NUTRICAO':'PIPELINE','GELADEIRA':'FORA',
  'GANHO':'GANHO','PERDIDO':'FORA'
};

// Export para Node.js (testes) — no browser são globais automaticamente
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esc, uuid, today, formatDate, daysDiff,
    CADENCE_DAYS, calcNextTouch,
    getPhase, getPriority,
    STATUS_FLOW_ALLOWED, STATUS_LABELS, canAdvanceStatus,
    calcChampScore,
    STAGE_PROBABILITY, STAGE_FORECAST
  };
}
