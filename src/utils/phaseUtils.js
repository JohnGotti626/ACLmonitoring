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
    topBorderCls: 'border-t-4 border-t-[#b91c1c]',
    numberColorCls: 'text-[#b91c1c]',
    pillCls: 'bg-red-50 text-[#b91c1c] border border-red-200',
    dotCls: 'bg-[#b91c1c]',
    barometerCls: 'bg-white text-slate-900 border border-stone-200 border-t-4 border-t-[#b91c1c]',
    badgeCls: 'bg-red-50 text-[#b91c1c] border border-red-200'
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
    topBorderCls: 'border-t-4 border-t-[#d97706]',
    numberColorCls: 'text-[#d97706]',
    pillCls: 'bg-amber-50 text-[#b45309] border border-amber-200',
    dotCls: 'bg-[#d97706]',
    barometerCls: 'bg-white text-slate-900 border border-stone-200 border-t-4 border-t-[#d97706]',
    badgeCls: 'bg-amber-50 text-[#b45309] border border-amber-200'
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
    topBorderCls: 'border-t-4 border-t-[#1d4ed8]',
    numberColorCls: 'text-[#1d4ed8]',
    pillCls: 'bg-blue-50 text-[#1d4ed8] border border-blue-200',
    dotCls: 'bg-[#1d4ed8]',
    barometerCls: 'bg-white text-slate-900 border border-stone-200 border-t-4 border-t-[#1d4ed8]',
    badgeCls: 'bg-blue-50 text-[#1d4ed8] border border-blue-200'
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
    topBorderCls: 'border-t-4 border-t-[#059669]',
    numberColorCls: 'text-[#047857]',
    pillCls: 'bg-emerald-50 text-[#047857] border border-emerald-200',
    dotCls: 'bg-[#059669]',
    barometerCls: 'bg-white text-slate-900 border border-stone-200 border-t-4 border-t-[#059669]',
    badgeCls: 'bg-emerald-50 text-[#047857] border border-emerald-200'
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
    topBorderCls: 'border-t-4 border-t-[#0d9488]',
    numberColorCls: 'text-[#0f766e]',
    pillCls: 'bg-teal-50 text-[#0f766e] border border-teal-200',
    dotCls: 'bg-[#0d9488]',
    barometerCls: 'bg-white text-slate-900 border border-stone-200 border-t-4 border-t-[#0d9488]',
    badgeCls: 'bg-teal-50 text-[#0f766e] border border-teal-200'
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
