const {
  esc, uuid, today, formatDate, daysDiff,
  CADENCE_DAYS, calcNextTouch,
  getPhase, getPriority,
  STATUS_FLOW_ALLOWED, canAdvanceStatus
} = require('./logic');

// ═══════════════════════════════════════════════════
// esc() — XSS sanitization
// ═══════════════════════════════════════════════════
describe('esc()', () => {
  test('retorna string vazia para null/undefined/empty', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
    expect(esc('')).toBe('');
  });

  test('escapa caracteres perigosos', () => {
    expect(esc('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(esc('"onclick="hack()"')).toBe('&quot;onclick=&quot;hack()&quot;');
    expect(esc("it's")).toBe('it&#39;s');
    expect(esc('A & B')).toBe('A &amp; B');
  });

  test('preserva texto normal', () => {
    expect(esc('Ana Paula Ferreira')).toBe('Ana Paula Ferreira');
    expect(esc('Crédito R$ 150.000')).toBe('Crédito R$ 150.000');
  });

  test('converte números para string', () => {
    expect(esc(42)).toBe('42');
  });
});

// ═══════════════════════════════════════════════════
// uuid()
// ═══════════════════════════════════════════════════
describe('uuid()', () => {
  test('gera IDs únicos', () => {
    const a = uuid();
    const b = uuid();
    expect(a).not.toBe(b);
  });

  test('retorna string não-vazia', () => {
    expect(typeof uuid()).toBe('string');
    expect(uuid().length).toBeGreaterThan(5);
  });
});

// ═══════════════════════════════════════════════════
// today()
// ═══════════════════════════════════════════════════
describe('today()', () => {
  test('retorna data no formato YYYY-MM-DD', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('retorna a data atual', () => {
    const now = new Date().toISOString().split('T')[0];
    expect(today()).toBe(now);
  });
});

// ═══════════════════════════════════════════════════
// formatDate()
// ═══════════════════════════════════════════════════
describe('formatDate()', () => {
  test('retorna — para null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  test('formata data ISO para dd/mm', () => {
    const result = formatDate('2026-04-06');
    expect(result).toMatch(/06\/04/);
  });
});

// ═══════════════════════════════════════════════════
// daysDiff()
// ═══════════════════════════════════════════════════
describe('daysDiff()', () => {
  test('retorna null para null/undefined', () => {
    expect(daysDiff(null)).toBeNull();
    expect(daysDiff(undefined)).toBeNull();
  });

  test('retorna 0 para hoje', () => {
    expect(daysDiff(today())).toBe(0);
  });

  test('retorna positivo para data futura', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysDiff(future.toISOString().split('T')[0])).toBe(5);
  });

  test('retorna negativo para data passada', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysDiff(past.toISOString().split('T')[0])).toBe(-3);
  });
});

// ═══════════════════════════════════════════════════
// getPhase() — Bipolar Engine
// ═══════════════════════════════════════════════════
describe('getPhase()', () => {
  test('zona verde: humor e energia bons', () => {
    expect(getPhase(7, 7)).toBe('verde');
    expect(getPhase(6, 6)).toBe('verde');
    expect(getPhase(8, 6)).toBe('verde');
  });

  test('estado misto: energia alta + humor baixo', () => {
    expect(getPhase(4, 7)).toBe('misto');
    expect(getPhase(3, 5)).toBe('misto');
    expect(getPhase(2, 8)).toBe('misto');
  });

  test('depressao: humor ou energia muito baixos', () => {
    expect(getPhase(2, 3)).toBe('depressao');
    expect(getPhase(3, 2)).toBe('depressao');
    expect(getPhase(1, 1)).toBe('depressao');
  });

  test('hipomaniaco: ambos altos', () => {
    expect(getPhase(8, 8)).toBe('hipomaniaco');
    expect(getPhase(9, 9)).toBe('hipomaniaco');
    expect(getPhase(10, 10)).toBe('hipomaniaco');
  });

  test('funcional: eixo comprometido mas não crítico', () => {
    expect(getPhase(5, 5)).toBe('funcional');
    expect(getPhase(4, 4)).toBe('funcional');
    expect(getPhase(5, 3)).toBe('funcional');
  });
});

// ═══════════════════════════════════════════════════
// calcNextTouch()
// ═══════════════════════════════════════════════════
describe('calcNextTouch()', () => {
  test('retorna null sem dataCriacao', () => {
    expect(calcNextTouch({ diaToqueAtual: 0 })).toBeNull();
  });

  test('retorna null se dia >= limite', () => {
    expect(calcNextTouch({ dataCriacao: today(), diaToqueAtual: 99 })).toBeNull();
  });

  test('calcula próximo toque D1 → D2 (1 dia depois)', () => {
    const result = calcNextTouch({ dataCriacao: today(), diaToqueAtual: 0 });
    expect(result).not.toBeNull();
    // D1 = +1 dia da criação
    const expected = new Date();
    expected.setDate(expected.getDate() + CADENCE_DAYS[1]);
    expect(result).toBe(expected.toISOString().split('T')[0]);
  });

  test('calcula toque D4 corretamente', () => {
    const result = calcNextTouch({ dataCriacao: today(), diaToqueAtual: 2 });
    const expected = new Date();
    expected.setDate(expected.getDate() + CADENCE_DAYS[3]); // index 3 = D4
    expect(result).toBe(expected.toISOString().split('T')[0]);
  });
});

// ═══════════════════════════════════════════════════
// getPriority()
// ═══════════════════════════════════════════════════
describe('getPriority()', () => {
  test('GANHO/PERDIDO/GELADEIRA = sempre C', () => {
    expect(getPriority({ status: 'GANHO' })).toBe('C');
    expect(getPriority({ status: 'PERDIDO' })).toBe('C');
    expect(getPriority({ status: 'GELADEIRA' })).toBe('C');
  });

  test('AGUARDANDO-DIAGNOSTICO hoje = A', () => {
    expect(getPriority({
      status: 'AGUARDANDO-DIAGNOSTICO',
      dataHoraDiagnostico: today()
    })).toBe('A');
  });

  test('AGUARDANDO-DIAGNOSTICO futuro = B', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getPriority({
      status: 'AGUARDANDO-DIAGNOSTICO',
      dataHoraDiagnostico: future.toISOString().split('T')[0]
    })).toBe('B');
  });

  test('NOVO sem toque = C', () => {
    expect(getPriority({ status: 'NOVO' })).toBe('C');
  });

  test('CADENCIA-ATIVA com toque hoje = A', () => {
    expect(getPriority({
      status: 'CADENCIA-ATIVA',
      proximoToque: today()
    })).toBe('A');
  });
});

// ═══════════════════════════════════════════════════
// canAdvanceStatus() — Fluxo do Kanban
// ═══════════════════════════════════════════════════
describe('canAdvanceStatus()', () => {
  test('NOVO → CADENCIA-ATIVA: permitido', () => {
    const r = canAdvanceStatus({ status: 'NOVO' }, 'CADENCIA-ATIVA');
    expect(r.ok).toBe(true);
  });

  test('NOVO → GANHO: bloqueado', () => {
    const r = canAdvanceStatus({ status: 'NOVO' }, 'GANHO');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Fluxo bloqueado');
  });

  test('CADENCIA → DIAGNOSTICO: permitido com CHAMP >= 4', () => {
    const r = canAdvanceStatus({ status: 'CADENCIA-ATIVA', champC:2, champH:1, champA:1, champM:0 }, 'AGUARDANDO-DIAGNOSTICO');
    expect(r.ok).toBe(true);
  });

  test('CADENCIA → DIAGNOSTICO: bloqueado com CHAMP < 4', () => {
    const r = canAdvanceStatus({ status: 'CADENCIA-ATIVA', champC:1, champH:1, champA:0, champM:0 }, 'AGUARDANDO-DIAGNOSTICO');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('CHAMP');
  });

  test('PROPOSTA → GANHO: precisa de dor + proximaAcao', () => {
    const r1 = canAdvanceStatus({ status: 'PROPOSTA-ENVIADA' }, 'GANHO');
    expect(r1.ok).toBe(false);
    expect(r1.error).toContain('DOR');

    const r2 = canAdvanceStatus({
      status: 'PROPOSTA-ENVIADA',
      dor: 'Precisa expandir',
      proximaAcao: 'Assinar contrato'
    }, 'GANHO');
    expect(r2.ok).toBe(true);
  });

  test('DIAGNOSTICO → PROPOSTA: precisa de dataHoraDiagnostico', () => {
    const r1 = canAdvanceStatus({ status: 'AGUARDANDO-DIAGNOSTICO' }, 'PROPOSTA-ENVIADA');
    expect(r1.ok).toBe(false);

    const r2 = canAdvanceStatus({
      status: 'AGUARDANDO-DIAGNOSTICO',
      dataHoraDiagnostico: '2026-04-10 14:00'
    }, 'PROPOSTA-ENVIADA');
    expect(r2.ok).toBe(true);
  });

  test('GANHO: nenhuma transição permitida', () => {
    const r = canAdvanceStatus({ status: 'GANHO' }, 'CADENCIA-ATIVA');
    expect(r.ok).toBe(false);
  });

  test('PERDIDO → CADENCIA-ATIVA: permitido (reativação)', () => {
    const r = canAdvanceStatus({ status: 'PERDIDO' }, 'CADENCIA-ATIVA');
    expect(r.ok).toBe(true);
  });

  test('todas as transições válidas são aceitas', () => {
    for (const [from, tos] of Object.entries(STATUS_FLOW_ALLOWED)) {
      for (const to of tos) {
        // Skip cases that need extra fields
        if (to === 'PROPOSTA-ENVIADA' || to === 'GANHO') continue;
        const r = canAdvanceStatus({ status: from, champC:3, champH:3, champA:3, champM:3 }, to);
        expect(r.ok).toBe(true);
      }
    }
  });
});
