/**
 * Sprint 1A — Migração de datas: dataGanho / dataPerda
 *
 * Lê leads do localStorage e preenche dataGanho/dataPerda
 * usando ultimaAtualizacao (ou dataCriacao) como fallback
 * para leads que já estão em GANHO ou PERDIDO.
 *
 * Uso: cole no console do navegador, ou importe via <script>.
 */
(function migrateDates() {
  var raw = localStorage.getItem('tc_leads');
  if (!raw) { console.warn('[migrate-dates] Nenhum lead encontrado em tc_leads'); return; }

  var leads = JSON.parse(raw);
  var migrou = 0;

  leads.forEach(function(l) {
    if (l.status === 'GANHO' && !l.dataGanho) {
      l.dataGanho = l.ultimaAtualizacao || l.dataCriacao;
      migrou++;
    }
    if (l.status === 'PERDIDO' && !l.dataPerda) {
      l.dataPerda = l.ultimaAtualizacao || l.dataCriacao;
      migrou++;
    }
  });

  if (migrou > 0) {
    localStorage.setItem('tc_leads', JSON.stringify(leads));
    console.log('[migrate-dates] ✅ ' + migrou + ' lead(s) migrado(s).');
  } else {
    console.log('[migrate-dates] Nenhum lead precisou de migração.');
  }
})();
