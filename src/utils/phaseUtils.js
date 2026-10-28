/**
 * Normalizza qualsiasi stringa di fase proveniente dall'UI o da vecchi mock
 * nei 4 valori ammessi dal CHECK constraint di PostgreSQL su Supabase:
 * - 'Early Phase'
 * - 'Return to Run'
 * - 'Return to Sport'
 * - 'Return to Play'
 */
export const CANONICAL_PHASES = [
  'Early Phase',
  'Return to Run',
  'Return to Sport',
  'Return to Play'
];

export const FIVE_LCA_PHASES = [
  {
    number: 1,
    id: 'FASE_1',
    stageId: 'EARLY_STAGE',
    shortLabel: 'Fase 1',
    name: 'Early Stage',
    subtitle: 'Controllo Infiammazione & ROM',
    fullLabel: 'Fase 1 (Early Stage)',
    dbPhase: 'Early Phase',
    barometerCls: 'bg-rose-100/80 text-rose-900 border border-rose-300/60',
    badgeCls: 'bg-rose-100/80 text-rose-900 border border-rose-300/60'
  },
  {
    number: 2,
    id: 'FASE_2',
    stageId: 'MID_STAGE',
    shortLabel: 'Fase 2',
    name: 'Mid Stage',
    subtitle: 'Forza, Jump & Landing',
    fullLabel: 'Fase 2 (Mid Stage)',
    dbPhase: 'Return to Run',
    barometerCls: 'bg-amber-100/80 text-amber-900 border border-amber-300/60',
    badgeCls: 'bg-amber-100/80 text-amber-900 border border-amber-300/60'
  },
  {
    number: 3,
    id: 'FASE_3',
    stageId: 'RETURN_TO_RUN',
    shortLabel: 'Fase 3',
    name: 'Return to Run',
    subtitle: 'Carico, Corsa & RSI',
    fullLabel: 'Fase 3 (Return to Run)',
    dbPhase: 'Return to Run',
    barometerCls: 'bg-yellow-100/80 text-yellow-900 border border-yellow-300/60',
    badgeCls: 'bg-yellow-100/80 text-yellow-900 border border-yellow-300/60'
  },
  {
    number: 4,
    id: 'FASE_4',
    stageId: 'LATE_STAGE',
    shortLabel: 'Fase 4',
    name: 'Late Stage',
    subtitle: 'CODs, Chaos & Plyo',
    fullLabel: 'Fase 4 (Late Stage)',
    dbPhase: 'Return to Sport',
    barometerCls: 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/60',
    badgeCls: 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/60'
  },
  {
    number: 5,
    id: 'FASE_5',
    stageId: 'PERFORMANCE',
    shortLabel: 'Fase 5',
    name: 'Return to Play',
    subtitle: 'Performance & Peak Power',
    fullLabel: 'Fase 5 (Return to Play)',
    dbPhase: 'Return to Play',
    barometerCls: 'bg-teal-100 text-teal-900 border border-teal-400/60',
    badgeCls: 'bg-teal-100 text-teal-900 border border-teal-400/60'
  }
];

/**
 * Risolve la stringa di fase effettiva di un paziente ignorando il vecchio default SQL
 * ("Fase 1: Pre-Op / Controllo Infiammazione") se fase_riabilitativa indica un'altra fase.
 */
export function resolveEffectivePhaseString(phaseInput) {
  if (!phaseInput) return 'Return to Run';
  if (typeof phaseInput === 'string') return phaseInput;

  const fa = String(phaseInput.fase_attuale || '').trim();
  const fr = String(phaseInput.fase_riabilitativa || '').trim();

  const isLegacyDefaultFase1 =
    fa.toLowerCase().includes('pre-op') && fr && fr.toLowerCase() !== 'early phase';

  if (isLegacyDefaultFase1) {
    return fr;
  }
  return fa || fr || 'Return to Run';
}

export function getPhaseNumber(phaseInput) {
  const raw = resolveEffectivePhaseString(phaseInput);
  const str = String(raw).toLowerCase().trim();

  if (str.includes('fase 2') || str.includes('mid') || str.includes('strength') || str.includes('forza') || str === '2' || str === 'mid_stage') {
    return 2;
  }
  if (str.includes('fase 3') || str.includes('run') || str.includes('drills') || str === '3' || str === 'return_to_run') {
    return 3;
  }
  if (str.includes('fase 4') || str.includes('late') || str.includes('cod') || str.includes('agility') || str === 'return to sport' || str === '4' || str === 'late_stage') {
    return 4;
  }
  if (str.includes('fase 5') || str.includes('perf') || str.includes('play') || str.includes('rts') || str === '5' || str === 'performance') {
    return 5;
  }
  if (str.includes('fase 1') || str.includes('early') || str.includes('rom') || str === '1' || str === 'early_stage') {
    return 1;
  }

  return 3;
}

export function getPhaseMeta(phaseInput) {
  const num = getPhaseNumber(phaseInput);
  return FIVE_LCA_PHASES.find((p) => p.number === num) || FIVE_LCA_PHASES[2];
}

export function normalizePhaseForDb(phaseInput) {
  const num = getPhaseNumber(phaseInput);
  switch (num) {
    case 1:
      return 'Early Phase';
    case 2:
    case 3:
      return 'Return to Run';
    case 4:
      return 'Return to Sport';
    case 5:
      return 'Return to Play';
    default:
      return 'Return to Run';
  }
}

/**
 * Format per la visualizzazione nei badge e nei titoli dell'applicazione
 */
export function formatPhaseForDisplay(phaseInput) {
  const meta = getPhaseMeta(phaseInput);
  return meta.fullLabel;
}

export const formatPhaseDisplay = formatPhaseForDisplay;
