/**
 * Normalizza qualsiasi stringa di fase proveniente dall'UI o da vecchi mock
 * nei 4 valori ammessi dal CHECK constraint di PostgreSQL su Supabase:
 * - 'Early Phase'
 * - 'Return to Run'
 * - 'Return to Sport'
 * - 'Return to Play'
 */
export function normalizePhaseForDb(phase) {
  if (!phase) return 'Return to Run';
  const str = String(phase).toLowerCase().trim();

  if (str.includes('early') || str.includes('rom') || str.includes('fase 1') || str === '1' || str === 'early_stage') {
    return 'Early Phase';
  }
  if (str.includes('mid') || str.includes('fase 2') || str === '2' || str === 'mid_stage') {
    return 'Return to Run';
  }
  if (str.includes('run') || str.includes('drills') || str.includes('fase 3') || str === '3' || str === 'return_to_run') {
    return 'Return to Run';
  }
  if (str.includes('late') || str.includes('cod') || str.includes('agility') || str.includes('fase 4') || str === '4' || str === 'late_stage') {
    return 'Return to Sport';
  }
  if (str.includes('perf') || str.includes('play') || str.includes('sport') || str.includes('rts') || str.includes('fase 5') || str === '5' || str === 'performance') {
    return 'Return to Play';
  }
  
  return 'Return to Run';
}

/**
 * Format per la visualizzazione nei badge e nei titoli dell'applicazione
 */
export function formatPhaseForDisplay(phase) {
  const norm = normalizePhaseForDb(phase);
  switch (norm) {
    case 'Early Phase':
      return 'Fase 1 (Early Stage)';
    case 'Return to Run':
      return 'Fase 3 (Return to Run)';
    case 'Return to Sport':
      return 'Fase 4 (Return to Sport)';
    case 'Return to Play':
      return 'Fase 5 (Return to Play)';
    default:
      return 'Fase 3 (Return to Run)';
  }
}
