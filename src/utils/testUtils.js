import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const createTestObject = (newValData, patientId, testIndex = 1) => {
  const newNum = testIndex;
  const parseVal = (v) => (v !== null && v !== undefined && v !== '' ? (typeof v === 'number' ? v : parseFloat(v)) : null);
  const parseLSI = (val) => {
    const parsed = parseVal(val);
    return parsed !== null && !isNaN(parsed) ? parsed : null;
  };

  const lsiQuadCalc = parseLSI(newValData.lsi_quad_calculated);
  const lsiFlexCalc = parseLSI(newValData.lsi_curl_calculated);

  const isoExtSx = parseVal(newValData.iso_leg_ext_sx);
  const isoExtDx = parseVal(newValData.iso_leg_ext_dx);
  const isoCurlSx = parseVal(newValData.iso_leg_curl_sx);
  const isoCurlDx = parseVal(newValData.iso_leg_curl_dx);

  // Compute LSI if not pre-calculated
  let calcLsiQuad = lsiQuadCalc;
  if (calcLsiQuad === null && isoExtSx && isoExtDx) {
    calcLsiQuad = parseFloat(((Math.min(isoExtSx, isoExtDx) / Math.max(isoExtSx, isoExtDx)) * 100).toFixed(1));
  }
  let calcLsiFlex = lsiFlexCalc;
  if (calcLsiFlex === null && isoCurlSx && isoCurlDx) {
    calcLsiFlex = parseFloat(((Math.min(isoCurlSx, isoCurlDx) / Math.max(isoCurlSx, isoCurlDx)) * 100).toFixed(1));
  }

  const quadOpVal = isoExtDx || isoExtSx || 0;
  const quadOpNmKgVal = quadOpVal ? parseFloat((quadOpVal / 150).toFixed(2)) : 0;

  // Drop Jump Bilaterale Metrics & Automatic Derivations
  const djBoxHeight = newValData.dj_box_height || '30 cm';
  const djJumpHeight = parseVal(newValData.dj_jump_height) || parseVal(newValData.jump_height_cm) || null;
  const djContactTime = parseVal(newValData.dj_contact_time);

  let djRSI = parseVal(newValData.dj_rsi);
  if (djRSI === null && djJumpHeight !== null && djContactTime !== null && djContactTime > 0) {
    djRSI = parseFloat(((djJumpHeight / 100) / (djContactTime / 1000)).toFixed(2));
  }

  // 3 Metriche Temporali Indipendenti (RTP Specialist Evidenze Scientifiche)
  const djTtpfMs = parseVal(newValData.dj_ttpf_ms); // Time to Peak Force (ms) [Target 80 - 120 ms]
  const djTakeoffAsymMs = parseVal(newValData.dj_takeoff_asym_ms); // Asimmetria Temporale allo Stacco (ms) [Target < 10 ms]

  // Force Plates Dual Load Cells SX/DX & Automatic LSI Derivations
  const djLandingPeakSX = parseVal(newValData.dj_landing_peak_sx);
  const djLandingPeakDX = parseVal(newValData.dj_landing_peak_dx);
  let djLandingPeakLsi = parseVal(newValData.dj_landing_peak_lsi);
  if (djLandingPeakLsi === null && djLandingPeakSX && djLandingPeakDX) {
    djLandingPeakLsi = parseFloat(((Math.min(djLandingPeakSX, djLandingPeakDX) / Math.max(djLandingPeakSX, djLandingPeakDX)) * 100).toFixed(1));
  }

  const djConcImpulseSX = parseVal(newValData.dj_conc_impulse_sx);
  const djConcImpulseDX = parseVal(newValData.dj_conc_impulse_dx);
  let djConcImpulseLsi = parseVal(newValData.dj_conc_impulse_lsi);
  if (djConcImpulseLsi === null && djConcImpulseSX && djConcImpulseDX) {
    djConcImpulseLsi = parseFloat(((Math.min(djConcImpulseSX, djConcImpulseDX) / Math.max(djConcImpulseSX, djConcImpulseDX)) * 100).toFixed(1));
  }

  // Automatic Evaluation & Test Status ("PASSED" vs "FAILED")
  let djValidationStatus = 'N/D';
  let djFailReason = '';

  if (djContactTime !== null || djRSI !== null || djTtpfMs !== null || djTakeoffAsymMs !== null) {
    const isGctOk = djContactTime !== null && djContactTime < 250;
    const isRsiOk = djRSI !== null && djRSI >= 1.8;
    const isTtpfOk = djTtpfMs !== null && djTtpfMs >= 80 && djTtpfMs <= 120;
    const isTakeoffOk = djTakeoffAsymMs === null || djTakeoffAsymMs < 10;
    const isLandingLsiOk = djLandingPeakLsi === null || djLandingPeakLsi >= 90;
    const isConcLsiOk = djConcImpulseLsi === null || djConcImpulseLsi >= 95;

    if (djContactTime !== null && djContactTime >= 250) {
      djValidationStatus = 'FAILED';
      djFailReason = 'FAILED - Tempo di Contatto > 250ms (Non Pliometrico)';
    } else if (djTtpfMs !== null && djTtpfMs < 60) {
      djValidationStatus = 'FAILED';
      djFailReason = 'FAILED - Atterraggio Rigido Stiff (TTPF < 60ms)';
    } else if (djTtpfMs !== null && (djTtpfMs < 80 || djTtpfMs > 120)) {
      djValidationStatus = 'FAILED';
      djFailReason = 'FAILED - TTPF Fuori Target (80-120ms)';
    } else if (!isTakeoffOk) {
      djValidationStatus = 'FAILED';
      djFailReason = 'FAILED - Asimmetria Temporale Stacco > 10ms';
    } else if (!isLandingLsiOk) {
      djValidationStatus = 'FAILED';
      djFailReason = 'FAILED - Asimmetria Picco Atterraggio < 90%';
    } else if (!isConcLsiOk) {
      djValidationStatus = 'FAILED';
      djFailReason = 'FAILED - Asimmetria Impulso Concentrico < 95%';
    } else if (!isRsiOk && djRSI !== null) {
      djValidationStatus = 'FAILED';
      djFailReason = 'FAILED - Indice Reattivo RSI < 1.8';
    } else {
      djValidationStatus = 'PASSED';
      djFailReason = 'PASSED - Tutti i Requisiti Clinici Soddisfatti';
    }
  }

  const newTest = {
    id: newValData.id || `test-${newNum}-${Date.now()}`,
    patient_id: patientId,
    patientId: patientId,
    num: newNum,
    label: newValData.label || `Test #${newNum}`,
    date: newValData.data_valutazione ? newValData.data_valutazione.split('-').reverse().join('/') : new Date().toLocaleDateString('it-IT'),
    data_valutazione: newValData.data_valutazione || new Date().toISOString().split('T')[0],
    
    // Simmetria & LSI
    lsiQuad: calcLsiQuad !== null ? calcLsiQuad : 0,
    lsiQuadDelta: '-',
    lsiFlex: calcLsiFlex !== null ? calcLsiFlex : 0,
    lsiFlexDelta: '-',
    lsiSingleHop: parseVal(newValData.lsi_single_hop) || 0,
    lsiTripleHop: parseVal(newValData.lsi_triple_hop) || 0,
    
    // Forza
    quadOpNmKg: quadOpNmKgVal,
    quadSano: isoExtSx !== null ? isoExtSx : undefined,
    quadOp: isoExtDx !== null ? isoExtDx : undefined,
    flexSano: isoCurlSx !== null ? isoCurlSx : undefined,
    flexOp: isoCurlDx !== null ? isoCurlDx : undefined,
    calfRaiseSX: parseVal(newValData.calf_raise_sx),
    calfRaiseDX: parseVal(newValData.calf_raise_dx),
    soleoSX: parseVal(newValData.soleo_sx),
    soleoDX: parseVal(newValData.soleo_dx),
    bulgarianSX: parseVal(newValData.bulgarian_sx),
    bulgarianDX: parseVal(newValData.bulgarian_dx),
    imtpForce: parseVal(newValData.imtp_peak_force) || '-',
    ikdc: parseVal(newValData.ikdc_score) || 80,

    // CMJ Bilaterale (Doppia associazione per compatibilità modale/tabella/DB)
    jumpHeight: parseVal(newValData.jump_height_cm) ?? parseVal(newValData.jumpHeight) ?? parseVal(newValData.altezza_salto) ?? null,
    jump_height_cm: parseVal(newValData.jump_height_cm) ?? parseVal(newValData.jumpHeight) ?? parseVal(newValData.altezza_salto) ?? null,
    altezza_salto: parseVal(newValData.jump_height_cm) ?? parseVal(newValData.jumpHeight) ?? parseVal(newValData.altezza_salto) ?? null,

    contractionTime: parseVal(newValData.contraction_time_ms) ?? parseVal(newValData.contractionTime) ?? parseVal(newValData.tempo_contrazione) ?? null,
    contraction_time_ms: parseVal(newValData.contraction_time_ms) ?? parseVal(newValData.contractionTime) ?? parseVal(newValData.tempo_contrazione) ?? null,

    peakPower: parseVal(newValData.peak_power_w) ?? parseVal(newValData.peakPower) ?? parseVal(newValData.potenza_picco) ?? null,
    peak_power_w: parseVal(newValData.peak_power_w) ?? parseVal(newValData.peakPower) ?? parseVal(newValData.potenza_picco) ?? null,

    rsiCmj: parseVal(newValData.rsi_cmj) ?? parseVal(newValData.rsiCmj) ?? parseVal(newValData.rsi_mod) ?? 
      ((parseVal(newValData.jump_height_cm) ?? parseVal(newValData.jumpHeight)) && (parseVal(newValData.contraction_time_ms) ?? parseVal(newValData.contractionTime))
        ? parseFloat((((parseVal(newValData.jump_height_cm) ?? parseVal(newValData.jumpHeight)) / 100) / ((parseVal(newValData.contraction_time_ms) ?? parseVal(newValData.contractionTime)) / 1000)).toFixed(2))
        : null),
    rsi_cmj: parseVal(newValData.rsi_cmj) ?? parseVal(newValData.rsiCmj) ?? parseVal(newValData.rsi_mod) ?? null,

    eccBrakingSX: parseVal(newValData.ecc_braking_sx) ?? parseVal(newValData.eccBrakingSX) ?? null,
    ecc_braking_sx: parseVal(newValData.ecc_braking_sx) ?? parseVal(newValData.eccBrakingSX) ?? null,

    eccBrakingDX: parseVal(newValData.ecc_braking_dx) ?? parseVal(newValData.eccBrakingDX) ?? null,
    ecc_braking_dx: parseVal(newValData.ecc_braking_dx) ?? parseVal(newValData.eccBrakingDX) ?? null,

    brakingAsym: newValData.ecc_braking_asym_calculated || newValData.brakingAsym || '0',
    cmjImpulseLsi: newValData.ecc_braking_asym_calculated 
      ? parseFloat((100 - parseFloat(newValData.ecc_braking_asym_calculated)).toFixed(1)) 
      : (parseVal(newValData.cmjImpulseLsi) ?? 0),

    concImpulseSX: parseVal(newValData.conc_impulse_sx) ?? parseVal(newValData.concImpulseSX) ?? null,
    conc_impulse_sx: parseVal(newValData.conc_impulse_sx) ?? parseVal(newValData.concImpulseSX) ?? null,

    concImpulseDX: parseVal(newValData.conc_impulse_dx) ?? parseVal(newValData.concImpulseDX) ?? null,
    conc_impulse_dx: parseVal(newValData.conc_impulse_dx) ?? parseVal(newValData.concImpulseDX) ?? null,

    concImpulseAsym: newValData.conc_impulse_asym_calculated || newValData.concImpulseAsym || '0',

    // CMJ Monopodalico
    slCmjHeightSX: parseVal(newValData.sl_cmj_height_sx) ?? parseVal(newValData.slCmjHeightSX) ?? null,
    slCmjHeightDX: parseVal(newValData.sl_cmj_height_dx) ?? parseVal(newValData.slCmjHeightDX) ?? null,
    slCmjCtSX: parseVal(newValData.sl_cmj_ct_sx) ?? parseVal(newValData.slCmjCtSX) ?? null,
    slCmjCtDX: parseVal(newValData.sl_cmj_ct_dx) ?? parseVal(newValData.slCmjCtDX) ?? null,
    slCmjPeakPowerSX: parseVal(newValData.sl_cmj_peak_power_sx) ?? parseVal(newValData.slCmjPeakPowerSX) ?? null,
    slCmjPeakPowerDX: parseVal(newValData.sl_cmj_peak_power_dx) ?? parseVal(newValData.slCmjPeakPowerDX) ?? null,
    slCmjRsiSX: parseVal(newValData.sl_cmj_rsi_sx) ?? parseVal(newValData.slCmjRsiSX) ?? null,
    slCmjRsiDX: parseVal(newValData.sl_cmj_rsi_dx) ?? parseVal(newValData.slCmjRsiDX) ?? null,
    slCmjEccImpulseSX: parseVal(newValData.sl_cmj_ecc_impulse_sx) ?? parseVal(newValData.slCmjEccImpulseSX) ?? null,
    slCmjEccImpulseDX: parseVal(newValData.sl_cmj_ecc_impulse_dx) ?? parseVal(newValData.slCmjEccImpulseDX) ?? null,
    slCmjHeightLsi: parseVal(newValData.lsi_sl_cmj_height_calculated) ?? parseVal(newValData.slCmjHeightLsi) ?? 0,

    // Drop Jump Bilaterale (RTP Specialist Metriche Temporali & Dual Load Cells)
    djBoxHeight,
    djJumpHeight,
    djContactTime,
    rsiDropJump: djRSI,
    djTtpfMs,
    djTakeoffAsymMs,
    djLandingPeakSX,
    djLandingPeakDX,
    djLandingPeakLsi,
    djConcImpulseSX,
    djConcImpulseDX,
    djConcImpulseLsi,
    djBrakingForce: parseVal(newValData.dj_braking_force),
    djBrakingImpulse: parseVal(newValData.dj_braking_impulse),
    djValidationStatus,
    djFailReason,

    // Drop Jump Monopodalico
    slDjBoxHeight: newValData.sl_dj_box_height || '30 cm',
    slDjCtSX: parseVal(newValData.sl_dj_ct_sx),
    slDjCtDX: parseVal(newValData.sl_dj_ct_dx),
    slDjRsiSX: parseVal(newValData.sl_dj_rsi_sx),
    slDjRsiDX: parseVal(newValData.sl_dj_rsi_dx),
    slDjHeightSX: parseVal(newValData.sl_dj_height_sx),
    slDjHeightDX: parseVal(newValData.sl_dj_height_dx),
    slDjBrakingSX: parseVal(newValData.sl_dj_braking_sx),
    slDjBrakingDX: parseVal(newValData.sl_dj_braking_dx),
    slDjRsiLsi: parseVal(newValData.lsi_sl_dj_rsi_calculated) || 0,
    aclrsi: parseVal(newValData.aclrsi) || 80
  };

  return newTest;
};

export async function saveTestToSupabase(newTest) {
  if (!isSupabaseConfigured) return;
  try {
    const { data, error } = await supabase.from('evaluations').insert([newTest]);
    if (error) {
      console.warn('Errore salvataggio Supabase evaluations:', error.message);
    } else {
      console.log('Test salvato con successo su Supabase evaluations:', data);
    }
  } catch (err) {
    console.warn('Eccezione Supabase evaluations:', err);
  }
}
