import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Mappa il modulo UI al codice canonico `test_type` usato nel DB per `custom_metric_definitions` e `patient_custom_metrics`.
 */
export const MODULE_TO_TEST_TYPE = {
  ISO_EXT: 'ISO_PUSH_LEG_EXT',
  ISO_CURL: 'ISO_PUSH_LEG_CURL',
  FORZA_DINAMICA: 'FORZA_ACCESSORIA',
  CMJ_BILATERAL: 'CMJ_BILATERALE',
  CMJ_SL: 'CMJ_MONOPODALICO',
  DJ_BILATERAL: 'RSI_DROP_JUMP',
  DJ_SL: 'SL_DROP_JUMP',
  CLINICAL_SCORES: 'SCORE_CLINICI',
  LSI: 'ISO_PUSH_LEG_EXT',
  FORZA: 'ISO_PUSH_LEG_EXT'
};

export function normalizeTestTypeCode(modOrType) {
  if (!modOrType) return 'CMJ_BILATERALE';
  return MODULE_TO_TEST_TYPE[modOrType] || String(modOrType).toUpperCase();
}

/**
 * Suggerimenti predefiniti per ogni `test_type` (uniti a quelli salvati su Supabase in `custom_metric_definitions`).
 */
export const DEFAULT_CUSTOM_METRIC_SUGGESTIONS = {
  ISO_PUSH_LEG_EXT: [
    { metric_name: 'Angolo Flessione Ginocchio', unit: 'gradi' },
    { metric_name: 'RFD 0-100ms Quadricipite SX', unit: 'N/s' },
    { metric_name: 'RFD 0-100ms Quadricipite DX', unit: 'N/s' },
    { metric_name: 'Torque di Picco Normalizzato', unit: 'N/m' },
    { metric_name: 'VAS Dolore Rotuleo durante spinta', unit: '/10' }
  ],
  ISO_PUSH_LEG_CURL: [
    { metric_name: 'Angolo Flessione Ischiocrurali', unit: 'gradi' },
    { metric_name: 'Picco Forza Ischiocrurali 30°', unit: 'N' },
    { metric_name: 'RFD 0-100ms Ischiocrurali', unit: 'N/s' }
  ],
  FORZA_ACCESSORIA: [
    { metric_name: 'ROM Dorsiflessione Caviglia (WBLT)', unit: 'cm' },
    { metric_name: '1RM Stimato Leg Press Monopodalica', unit: 'kg' },
    { metric_name: 'Velocità Media Concentrica VBT', unit: 'm/s' }
  ],
  CMJ_BILATERALE: [
    { metric_name: 'Angolo Flessione Ginocchio Max', unit: 'gradi' },
    { metric_name: 'Tempo di Volo', unit: 'ms' },
    { metric_name: 'Velocità di Stacco (Takeoff Velocity)', unit: 'm/s' },
    { metric_name: 'Picco Forza Concentrica', unit: 'N' }
  ],
  CMJ_MONOPODALICO: [
    { metric_name: 'Valgismo Dinamico Ginocchio (FPPA 2D)', unit: 'gradi' },
    { metric_name: 'Tempo Stabilizzazione Atterraggio (TTS)', unit: 's' },
    { metric_name: 'Picco Forza Verticale Atterraggio', unit: 'BW' }
  ],
  RSI_DROP_JUMP: [
    { metric_name: 'Angolo Flessione Ginocchio al Contatto', unit: 'gradi' },
    { metric_name: 'Picco Forza Verticale vGRF', unit: 'BW' },
    { metric_name: 'Stiffness Verticale Kvert', unit: 'kN/m' }
  ],
  SL_DROP_JUMP: [
    { metric_name: 'Controllo Frontale Pelvi-Ginocchio', unit: 'gradi' },
    { metric_name: 'Picco Forza Atterraggio Monopodalico', unit: 'BW' }
  ],
  SCORE_CLINICI: [
    { metric_name: 'Scala Tegner Activity Level', unit: 'pts' },
    { metric_name: 'Marx Activity Rating Scale', unit: 'pts' },
    { metric_name: 'Y-Balance Test Composite LSI', unit: '%' }
  ]
};

/**
 * Esegue query su `public.custom_metric_definitions` filtrando per `test_type`
 * e unisce i risultati con i suggerimenti clinici di base.
 */
export async function fetchCustomMetricDefinitions(testTypeInput) {
  const testType = normalizeTestTypeCode(testTypeInput);
  const baseList = DEFAULT_CUSTOM_METRIC_SUGGESTIONS[testType] || [];
  const mergedMap = new Map();

  baseList.forEach(item => {
    mergedMap.set(item.metric_name.toLowerCase(), {
      test_type: testType,
      metric_name: item.metric_name,
      unit: item.unit || ''
    });
  });

  if (!isSupabaseConfigured) {
    return Array.from(mergedMap.values());
  }

  try {
    const { data, error } = await supabase
      .from('custom_metric_definitions')
      .select('id, test_type, metric_name, unit')
      .eq('test_type', testType)
      .order('metric_name', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(row => {
        if (row?.metric_name) {
          mergedMap.set(row.metric_name.trim().toLowerCase(), {
            id: row.id,
            test_type: row.test_type,
            metric_name: row.metric_name.trim(),
            unit: row.unit || ''
          });
        }
      });
    }
  } catch (err) {
    console.warn('Info fetchCustomMetricDefinitions:', err);
  }

  return Array.from(mergedMap.values());
}

/**
 * Recupera lo storico delle metriche personalizzate già utilizzate dal singolo paziente per un dato `test_type`
 * (sia dalla tabella `patient_custom_metrics` sia dallo storico `patient.tests`),
 * così da pre-popolare automaticamente i campi quando il paziente ripete il test a distanza di settimane.
 */
export async function fetchPatientPreviousCustomMetrics(patient, testTypeInput) {
  const testType = normalizeTestTypeCode(testTypeInput);
  const templateMap = new Map();
  const hiddenSet = new Set();

  // 1. Ricerca nello storico locale/JSONB `patient.tests`
  const tests = Array.isArray(patient?.tests) ? patient.tests : [];
  tests.forEach(t => {
    const byType = t?.custom_metrics?.[testType];
    if (Array.isArray(byType)) {
      byType.forEach(m => {
        if (!m?.metric_name) return;
        const key = m.metric_name.trim().toLowerCase();
        if (m.is_hidden) {
          hiddenSet.add(key);
        } else if (!hiddenSet.has(key)) {
          templateMap.set(key, {
            metric_name: m.metric_name.trim(),
            unit: m.unit || ''
          });
        }
      });
    }
  });

  // 2. Ricerca sulla tabella Supabase `public.patient_custom_metrics`
  const isUuid =
    typeof patient?.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patient.id);

  if (isSupabaseConfigured && isUuid) {
    try {
      const { data, error } = await supabase
        .from('patient_custom_metrics')
        .select('metric_name, unit, is_hidden, created_at')
        .eq('patient_id', patient.id)
        .eq('test_type', testType)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        data.forEach(row => {
          if (!row?.metric_name) return;
          const key = row.metric_name.trim().toLowerCase();
          if (row.is_hidden) {
            hiddenSet.add(key);
            templateMap.delete(key);
          } else if (!hiddenSet.has(key)) {
            templateMap.set(key, {
              metric_name: row.metric_name.trim(),
              unit: row.unit || templateMap.get(key)?.unit || ''
            });
          }
        });
      }
    } catch (err) {
      console.warn('Info fetchPatientPreviousCustomMetrics:', err);
    }
  }

  return Array.from(templateMap.values());
}

/**
 * Salva le metriche personalizzate:
 * 1. Inserisce eventuali nuove definizioni in `public.custom_metric_definitions` (ON CONFLICT DO NOTHING / upsert)
 * 2. Salva i valori misurati nella tabella `public.patient_custom_metrics`
 */
export async function saveCustomMetricsToSupabase({
  patientId,
  evaluationId,
  sessionKey,
  testTypeInput,
  customMetricsList
}) {
  if (!isSupabaseConfigured || !Array.isArray(customMetricsList) || customMetricsList.length === 0) {
    return;
  }

  const testType = normalizeTestTypeCode(testTypeInput);
  const validDefinitions = customMetricsList
    .filter(m => m && typeof m.metric_name === 'string' && m.metric_name.trim() !== '' && !m.is_hidden)
    .map(m => ({
      test_type: testType,
      metric_name: m.metric_name.trim(),
      unit: m.unit ? m.unit.trim() : null
    }));

  // 1. Upsert in `public.custom_metric_definitions` per i suggerimenti globali futuri
  if (validDefinitions.length > 0) {
    try {
      await supabase
        .from('custom_metric_definitions')
        .upsert(validDefinitions, { onConflict: 'test_type,metric_name' });
    } catch (err) {
      console.warn('Info salvataggio custom_metric_definitions:', err);
    }
  }

  // 2. Salvataggio valori misurati su `public.patient_custom_metrics`
  const isPatientUuid =
    typeof patientId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
  const isEvalUuid =
    typeof evaluationId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evaluationId);

  if (!isPatientUuid) return;

  const measuredRows = customMetricsList
    .filter(m => m && typeof m.metric_name === 'string' && m.metric_name.trim() !== '')
    .map(m => ({
      patient_id: patientId,
      evaluation_id: isEvalUuid ? evaluationId : null,
      session_key: sessionKey || String(evaluationId || ''),
      test_type: testType,
      metric_name: m.metric_name.trim(),
      unit: m.unit ? m.unit.trim() : null,
      metric_value: toStrictNullOrNumber(m.metric_value, true),
      is_hidden: Boolean(m.is_hidden)
    }));

  if (measuredRows.length > 0) {
    try {
      await supabase.from('patient_custom_metrics').insert(measuredRows);
    } catch (err) {
      console.warn('Info salvataggio patient_custom_metrics:', err);
    }
  }
}

/**
 * Nasconde/elimina una metrica personalizzata per un paziente su Supabase
 */
export async function hideCustomMetricInSupabase(patientId, testTypeInput, metricName) {
  if (!isSupabaseConfigured || !patientId || !metricName) return;
  const testType = normalizeTestTypeCode(testTypeInput);
  const isPatientUuid =
    typeof patientId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
  if (!isPatientUuid) return;

  try {
    await supabase
      .from('patient_custom_metrics')
      .update({ is_hidden: true })
      .eq('patient_id', patientId)
      .eq('test_type', testType)
      .ilike('metric_name', metricName.trim());
  } catch (err) {
    console.warn('Info hideCustomMetricInSupabase:', err);
  }
}

/**
 * Converte un valore in numero valido oppure rigorosamente `null`.
 * Campi vuoti ('', '-', undefined, null, NaN) o <= 0 (quando allowZero=false) restituiscono SEMPRE `null`, MAI 0.
 */
export function toStrictNullOrNumber(v, allowZero = false) {
  if (v === null || v === undefined || v === '' || v === '-' || v === 'N/D' || v === 'N/A') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', '').replace(',', '.').trim());
  if (isNaN(n)) return null;
  if (!allowZero && n <= 0) return null;
  if (allowZero && n < 0) return null;
  return n;
}

/**
 * Estrae o calcola dinamicamente una metrica da una singola sessione di test.
 * Filtra rigorosamente tutti i valori null, undefined o 0 non validi.
 */
export function extractMetricFromSingleTest(test, keys, allowZero = false) {
  if (!test || typeof test !== 'object') return null;

  const keyList = Array.isArray(keys) ? keys : [keys];

  // 1. Ricerca diretta sulle chiavi richieste
  for (const key of keyList) {
    const num = toStrictNullOrNumber(test[key], allowZero);
    if (num !== null) return num;
  }

  // 2. Derivazione intelligente dai dati grezzi se tutti gli input necessari sono validi (> 0)
  const keySet = new Set(keyList);

  if (keySet.has('lsiQuad') || keySet.has('lsi_quad_calculated')) {
    const sx = toStrictNullOrNumber(test.quadSano ?? test.iso_leg_ext_sx);
    const dx = toStrictNullOrNumber(test.quadOp ?? test.iso_leg_ext_dx);
    if (sx !== null && dx !== null && sx > 0 && dx > 0) {
      return parseFloat(((Math.min(sx, dx) / Math.max(sx, dx)) * 100).toFixed(1));
    }
  }

  if (keySet.has('lsiFlex') || keySet.has('lsi_curl_calculated')) {
    const sx = toStrictNullOrNumber(test.flexSano ?? test.iso_leg_curl_sx);
    const dx = toStrictNullOrNumber(test.flexOp ?? test.iso_leg_curl_dx);
    if (sx !== null && dx !== null && sx > 0 && dx > 0) {
      return parseFloat(((Math.min(sx, dx) / Math.max(sx, dx)) * 100).toFixed(1));
    }
  }

  if (keySet.has('quadOpNmKg') || keySet.has('quad_rel_op')) {
    const qOp = toStrictNullOrNumber(test.quadOp ?? test.iso_leg_ext_dx ?? test.quadSano ?? test.iso_leg_ext_sx);
    if (qOp !== null && qOp > 0) {
      return parseFloat((qOp / 150).toFixed(2));
    }
  }

  if (keySet.has('hqRatio')) {
    const fOp = toStrictNullOrNumber(test.flexOp ?? test.iso_leg_curl_dx);
    const qOp = toStrictNullOrNumber(test.quadOp ?? test.iso_leg_ext_dx);
    if (fOp !== null && qOp !== null && qOp > 0) {
      return parseFloat((fOp / qOp).toFixed(2));
    }
    const fSano = toStrictNullOrNumber(test.flexSano ?? test.iso_leg_curl_sx);
    const qSano = toStrictNullOrNumber(test.quadSano ?? test.iso_leg_ext_sx);
    if (fSano !== null && qSano !== null && qSano > 0) {
      return parseFloat((fSano / qSano).toFixed(2));
    }
  }

  if (keySet.has('cmjImpulseLsi') || keySet.has('lsi_cmj_braking')) {
    const sx = toStrictNullOrNumber(test.eccBrakingSX ?? test.ecc_braking_sx);
    const dx = toStrictNullOrNumber(test.eccBrakingDX ?? test.ecc_braking_dx);
    if (sx !== null && dx !== null && sx > 0 && dx > 0) {
      return parseFloat(((Math.min(sx, dx) / Math.max(sx, dx)) * 100).toFixed(1));
    }
    const asym = toStrictNullOrNumber(test.brakingAsym ?? test.ecc_braking_asym_calculated, true);
    if (asym !== null && asym >= 0 && asym < 100) {
      return parseFloat((100 - asym).toFixed(1));
    }
  }

  if (keySet.has('slCmjHeightLsi') || keySet.has('lsi_sl_cmj_height_calculated')) {
    const sx = toStrictNullOrNumber(test.slCmjHeightSX ?? test.sl_cmj_height_sx);
    const dx = toStrictNullOrNumber(test.slCmjHeightDX ?? test.sl_cmj_height_dx);
    if (sx !== null && dx !== null && sx > 0 && dx > 0) {
      return parseFloat(((Math.min(sx, dx) / Math.max(sx, dx)) * 100).toFixed(1));
    }
  }

  if (keySet.has('rsiDropJump') || keySet.has('dj_rsi') || keySet.has('djRSI')) {
    const h = toStrictNullOrNumber(test.djJumpHeight ?? test.dj_jump_height);
    const ct = toStrictNullOrNumber(test.djContactTime ?? test.dj_contact_time);
    if (h !== null && ct !== null && ct > 0) {
      return parseFloat(((h / 100) / (ct / 1000)).toFixed(2));
    }
  }

  if (keySet.has('rsiCmj') || keySet.has('rsi_cmj') || keySet.has('rsi_mod')) {
    const h = toStrictNullOrNumber(test.jumpHeight ?? test.jump_height_cm ?? test.altezza_salto);
    const ct = toStrictNullOrNumber(test.contractionTime ?? test.contraction_time_ms ?? test.tempo_contrazione);
    if (h !== null && ct !== null && ct > 0) {
      return parseFloat(((h / 100) / (ct / 1000)).toFixed(2));
    }
  }

  return null;
}

/**
 * Cerca a ritroso nei test del paziente in ordine CRONOLOGICO TEMPORALE (dal più recente al più vecchio)
 * l'ultimo valore valido registrato (ignorando rigorosamente null, undefined e 0)
 * e restituisce anche i metadati della sessione.
 */
export function getLastValidMetricWithMeta(tests, metricKeys, options = {}) {
  if (!Array.isArray(tests) || tests.length === 0) return null;
  const keys = Array.isArray(metricKeys) ? metricKeys : [metricKeys];
  const allowZero = Boolean(options.allowZero);

  const flat = tests.flat(Infinity).filter(t => t && typeof t === 'object' && !Array.isArray(t));
  if (flat.length === 0) return null;

  const sortedDesc = [...flat].sort((a, b) => getTestTimestamp(b) - getTestTimestamp(a));

  for (let i = 0; i < sortedDesc.length; i++) {
    const test = sortedDesc[i];
    const val = extractMetricFromSingleTest(test, keys, allowZero);
    if (val !== null) {
      const formattedDate =
        test.date ||
        (test.data_valutazione ? test.data_valutazione.split('-').reverse().join('/') : null);
      return {
        value: val,
        testDate: formattedDate,
        testLabel: test.session_name || test.label || (test.num ? `Sessione #${test.num}` : 'Sessione'),
        testNum: test.num || sortedDesc.length - i,
        isHistorical: i > 0
      };
    }
  }

  return null;
}

export function getLastValidMetricValue(tests, metricKeys, options = {}) {
  const meta = getLastValidMetricWithMeta(tests, metricKeys, options);
  return meta ? meta.value : null;
}

/**
 * Normalizza e pulisce una mappa di metriche personalizzate `{ [test_type]: [{ metric_name, unit, metric_value, is_hidden }] }`
 */
export function sanitizeCustomMetricsMap(customMetricsMap) {
  if (!customMetricsMap || typeof customMetricsMap !== 'object') return {};
  const cleaned = {};
  Object.entries(customMetricsMap).forEach(([testTypeKey, list]) => {
    if (!Array.isArray(list)) return;
    const normKey = normalizeTestTypeCode(testTypeKey);
    const items = [];
    const seen = new Set();
    list.forEach(item => {
      if (!item || typeof item.metric_name !== 'string') return;
      const name = item.metric_name.trim();
      if (!name) return;
      const lower = name.toLowerCase();
      if (seen.has(lower)) return;
      seen.add(lower);
      items.push({
        metric_name: name,
        unit: item.unit ? String(item.unit).trim() : '',
        metric_value: toStrictNullOrNumber(item.metric_value, true),
        is_hidden: Boolean(item.is_hidden)
      });
    });
    if (items.length > 0) {
      cleaned[normKey] = items;
    }
  });
  return cleaned;
}

/**
 * Unisce due mappe di metriche personalizzate preservando i valori non-null e lo stato `is_hidden`.
 */
export function mergeCustomMetricsMaps(oldMap, newMap) {
  const base = sanitizeCustomMetricsMap(oldMap);
  const incoming = sanitizeCustomMetricsMap(newMap);
  const result = { ...base };

  Object.entries(incoming).forEach(([testType, incList]) => {
    const existingList = Array.isArray(result[testType]) ? [...result[testType]] : [];
    const byName = new Map();
    existingList.forEach(item => {
      byName.set(item.metric_name.toLowerCase(), { ...item });
    });

    incList.forEach(incItem => {
      const key = incItem.metric_name.toLowerCase();
      const prev = byName.get(key);
      if (incItem.is_hidden) {
        byName.set(key, {
          ...prev,
          ...incItem,
          is_hidden: true
        });
      } else {
        byName.set(key, {
          metric_name: incItem.metric_name,
          unit: incItem.unit || prev?.unit || '',
          metric_value:
            incItem.metric_value !== null && incItem.metric_value !== undefined
              ? incItem.metric_value
              : (prev?.metric_value ?? null),
          is_hidden: false
        });
      }
    });

    result[testType] = Array.from(byName.values());
  });

  return result;
}

/**
 * Crea un oggetto di valutazione pulito, assicurando che tutti i campi non compilati siano `null` (MAI 0 o valori fittizi).
 */
export const createTestObject = (newValData, patientId, testIndex = 1) => {
  const newNum = testIndex;
  const parseVal = (v) => toStrictNullOrNumber(v, false);
  const parseValAllowZero = (v) => toStrictNullOrNumber(v, true);

  const isoExtSx = parseVal(newValData.iso_leg_ext_sx ?? newValData.quadSano);
  const isoExtDx = parseVal(newValData.iso_leg_ext_dx ?? newValData.quadOp);
  const isoCurlSx = parseVal(newValData.iso_leg_curl_sx ?? newValData.flexSano);
  const isoCurlDx = parseVal(newValData.iso_leg_curl_dx ?? newValData.flexOp);

  let calcLsiQuad = parseVal(newValData.lsi_quad_calculated ?? newValData.lsiQuad);
  if (calcLsiQuad === null && isoExtSx !== null && isoExtDx !== null) {
    calcLsiQuad = parseFloat(((Math.min(isoExtSx, isoExtDx) / Math.max(isoExtSx, isoExtDx)) * 100).toFixed(1));
  }

  let calcLsiFlex = parseVal(newValData.lsi_curl_calculated ?? newValData.lsiFlex);
  if (calcLsiFlex === null && isoCurlSx !== null && isoCurlDx !== null) {
    calcLsiFlex = parseFloat(((Math.min(isoCurlSx, isoCurlDx) / Math.max(isoCurlSx, isoCurlDx)) * 100).toFixed(1));
  }

  const opKnee = newValData.ginocchio_operato || 'DX';
  const quadOpVal = opKnee === 'SX' ? (isoExtSx ?? isoExtDx) : (isoExtDx ?? isoExtSx);
  const quadOpNmKgVal =
    parseVal(newValData.quadOpNmKg) ??
    (quadOpVal !== null ? parseFloat((quadOpVal / 150).toFixed(2)) : null);

  // Drop Jump Bilaterale Metrics
  const djJumpHeight = parseVal(newValData.dj_jump_height ?? newValData.djJumpHeight);
  const djContactTime = parseVal(newValData.dj_contact_time ?? newValData.djContactTime);

  let djRSI = parseVal(newValData.dj_rsi ?? newValData.rsiDropJump ?? newValData.djRSI);
  if (djRSI === null && djJumpHeight !== null && djContactTime !== null && djContactTime > 0) {
    djRSI = parseFloat(((djJumpHeight / 100) / (djContactTime / 1000)).toFixed(2));
  }

  const djTtpfMs = parseVal(newValData.dj_ttpf_ms ?? newValData.djTtpfMs);
  const djTakeoffAsymMs = parseValAllowZero(newValData.dj_takeoff_asym_ms ?? newValData.djTakeoffAsymMs);

  const djLandingPeakSX = parseVal(newValData.dj_landing_peak_sx ?? newValData.djLandingPeakSX);
  const djLandingPeakDX = parseVal(newValData.dj_landing_peak_dx ?? newValData.djLandingPeakDX);
  let djLandingPeakLsi = parseVal(newValData.dj_landing_peak_lsi ?? newValData.djLandingPeakLsi);
  if (djLandingPeakLsi === null && djLandingPeakSX !== null && djLandingPeakDX !== null) {
    djLandingPeakLsi = parseFloat(((Math.min(djLandingPeakSX, djLandingPeakDX) / Math.max(djLandingPeakSX, djLandingPeakDX)) * 100).toFixed(1));
  }

  const djConcImpulseSX = parseVal(newValData.dj_conc_impulse_sx ?? newValData.djConcImpulseSX);
  const djConcImpulseDX = parseVal(newValData.dj_conc_impulse_dx ?? newValData.djConcImpulseDX);
  let djConcImpulseLsi = parseVal(newValData.dj_conc_impulse_lsi ?? newValData.djConcImpulseLsi);
  if (djConcImpulseLsi === null && djConcImpulseSX !== null && djConcImpulseDX !== null) {
    djConcImpulseLsi = parseFloat(((Math.min(djConcImpulseSX, djConcImpulseDX) / Math.max(djConcImpulseSX, djConcImpulseDX)) * 100).toFixed(1));
  }

  const hasDjData =
    djJumpHeight !== null ||
    djContactTime !== null ||
    djRSI !== null ||
    djTtpfMs !== null ||
    djTakeoffAsymMs !== null ||
    djLandingPeakSX !== null ||
    djConcImpulseSX !== null;

  let djValidationStatus = null;
  let djFailReason = null;

  if (hasDjData) {
    const isRsiOk = djRSI !== null && djRSI >= 1.8;
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

  const jumpHeight = parseVal(newValData.jump_height_cm ?? newValData.jumpHeight ?? newValData.altezza_salto);
  const contractionTime = parseVal(newValData.contraction_time_ms ?? newValData.contractionTime ?? newValData.tempo_contrazione);
  const peakPower = parseVal(newValData.peak_power_w ?? newValData.peakPower ?? newValData.potenza_picco);
  const cmjDepth = parseVal(newValData.cmj_depth ?? newValData.cmjDepth ?? newValData.countermovement_depth);
  const eccBrakingRfd = parseVal(newValData.ecc_braking_rfd ?? newValData.eccBrakingRfd ?? newValData.eccentric_braking_rfd);
  const eccBrakingSX = parseVal(newValData.ecc_braking_sx ?? newValData.eccBrakingSX);
  const eccBrakingDX = parseVal(newValData.ecc_braking_dx ?? newValData.eccBrakingDX);
  const concImpulseSX = parseVal(newValData.conc_impulse_sx ?? newValData.concImpulseSX);
  const concImpulseDX = parseVal(newValData.conc_impulse_dx ?? newValData.concImpulseDX);

  let rsiCmj = parseVal(newValData.rsi_cmj ?? newValData.rsiCmj ?? newValData.rsi_mod);
  if (rsiCmj === null && jumpHeight !== null && contractionTime !== null && contractionTime > 0) {
    rsiCmj = parseFloat(((jumpHeight / 100) / (contractionTime / 1000)).toFixed(2));
  }

  let cmjImpulseLsi = parseVal(newValData.cmjImpulseLsi);
  if (cmjImpulseLsi === null && eccBrakingSX !== null && eccBrakingDX !== null) {
    cmjImpulseLsi = parseFloat(((Math.min(eccBrakingSX, eccBrakingDX) / Math.max(eccBrakingSX, eccBrakingDX)) * 100).toFixed(1));
  } else if (cmjImpulseLsi === null && newValData.ecc_braking_asym_calculated !== null && newValData.ecc_braking_asym_calculated !== undefined) {
    const asym = parseValAllowZero(newValData.ecc_braking_asym_calculated);
    if (asym !== null) {
      cmjImpulseLsi = parseFloat((100 - Math.abs(asym)).toFixed(1));
    }
  }

  const slCmjHeightSX = parseVal(newValData.sl_cmj_height_sx ?? newValData.slCmjHeightSX);
  const slCmjHeightDX = parseVal(newValData.sl_cmj_height_dx ?? newValData.slCmjHeightDX);
  let slCmjHeightLsi = parseVal(newValData.lsi_sl_cmj_height_calculated ?? newValData.slCmjHeightLsi);
  if (slCmjHeightLsi === null && slCmjHeightSX !== null && slCmjHeightDX !== null) {
    slCmjHeightLsi = parseFloat(((Math.min(slCmjHeightSX, slCmjHeightDX) / Math.max(slCmjHeightSX, slCmjHeightDX)) * 100).toFixed(1));
  }

  const slDjCtSX = parseVal(newValData.sl_dj_ct_sx ?? newValData.slDjCtSX);
  const slDjCtDX = parseVal(newValData.sl_dj_ct_dx ?? newValData.slDjCtDX);
  const slDjRsiSX = parseVal(newValData.sl_dj_rsi_sx ?? newValData.slDjRsiSX);
  const slDjRsiDX = parseVal(newValData.sl_dj_rsi_dx ?? newValData.slDjRsiDX);
  const slDjHeightSX = parseVal(newValData.sl_dj_height_sx ?? newValData.slDjHeightSX);
  const slDjHeightDX = parseVal(newValData.sl_dj_height_dx ?? newValData.slDjHeightDX);
  const slDjBrakingSX = parseVal(newValData.sl_dj_braking_sx ?? newValData.slDjBrakingSX);
  const slDjBrakingDX = parseVal(newValData.sl_dj_braking_dx ?? newValData.slDjBrakingDX);
  const hasSlDjData =
    slDjCtSX !== null ||
    slDjCtDX !== null ||
    slDjRsiSX !== null ||
    slDjRsiDX !== null ||
    slDjHeightSX !== null ||
    slDjHeightDX !== null ||
    slDjBrakingSX !== null ||
    slDjBrakingDX !== null;

  const evalDateIso = newValData.data_valutazione || new Date().toISOString().split('T')[0];
  const evalDateFormatted = evalDateIso.includes('-')
    ? evalDateIso.split('-').reverse().join('/')
    : evalDateIso;

  const sessionName = newValData.session_name || newValData.label || `Test #${newNum}`;
  const testModule = newValData.test_module || 'ALL';
  const existingModuleDates = newValData.module_dates || {};
  const customMetricsClean = sanitizeCustomMetricsMap(newValData.custom_metrics);

  const newTest = {
    id: newValData.id || `test-${newNum}-${Date.now()}`,
    patient_id: patientId,
    patientId: patientId,
    num: newNum,
    label: sessionName,
    session_name: sessionName,
    session_id: newValData.session_id || newValData.id || `sess-${Date.now()}`,
    test_module: testModule,
    module_dates: {
      ...existingModuleDates,
      [testModule]: evalDateFormatted
    },
    custom_metrics: customMetricsClean,
    date: evalDateFormatted,
    data_valutazione: evalDateIso,
    ginocchio_operato: opKnee,
    fase_riabilitativa: newValData.fase_riabilitativa || null,
    valutatore: newValData.valutatore || null,

    // Simmetria & LSI (tutti null se assenti)
    lsiQuad: calcLsiQuad,
    lsiQuadDelta: null,
    lsiFlex: calcLsiFlex,
    lsiFlexDelta: null,
    lsiSingleHop: parseVal(newValData.lsi_single_hop ?? newValData.lsiSingleHop),
    lsiTripleHop: parseVal(newValData.lsi_triple_hop ?? newValData.lsiTripleHop),

    // Forza (tutti null se assenti, MAI numeri hardcoded)
    quadOpNmKg: quadOpNmKgVal,
    quadSano: isoExtSx,
    quadOp: isoExtDx,
    iso_leg_ext_sx: isoExtSx,
    iso_leg_ext_dx: isoExtDx,
    flexSano: isoCurlSx,
    flexOp: isoCurlDx,
    iso_leg_curl_sx: isoCurlSx,
    iso_leg_curl_dx: isoCurlDx,
    calfRaiseSX: parseVal(newValData.calf_raise_sx ?? newValData.calfRaiseSX),
    calfRaiseDX: parseVal(newValData.calf_raise_dx ?? newValData.calfRaiseDX),
    soleoSX: parseVal(newValData.soleo_sx ?? newValData.soleoSX),
    soleoDX: parseVal(newValData.soleo_dx ?? newValData.soleoDX),
    bulgarianSX: parseVal(newValData.bulgarian_sx ?? newValData.bulgarianSX),
    bulgarianDX: parseVal(newValData.bulgarian_dx ?? newValData.bulgarianDX),
    imtpForce: parseVal(newValData.imtp_peak_force ?? newValData.imtpForce),
    ikdc: parseVal(newValData.ikdc_score ?? newValData.ikdc),
    ikdc_score: parseVal(newValData.ikdc_score ?? newValData.ikdc),
    aclrsi: parseVal(newValData.aclrsi ?? newValData.acl_rsi),

    // CMJ Bilaterale
    jumpHeight,
    jump_height_cm: jumpHeight,
    altezza_salto: jumpHeight,
    contractionTime,
    contraction_time_ms: contractionTime,
    peakPower,
    peak_power_w: peakPower,
    rsiCmj,
    rsi_cmj: rsiCmj,
    cmjDepth,
    cmj_depth: cmjDepth,
    eccBrakingRfd,
    ecc_braking_rfd: eccBrakingRfd,
    eccBrakingSX,
    ecc_braking_sx: eccBrakingSX,
    eccBrakingDX,
    ecc_braking_dx: eccBrakingDX,
    brakingAsym: parseValAllowZero(newValData.ecc_braking_asym_calculated ?? newValData.brakingAsym),
    cmjImpulseLsi,
    concImpulseSX,
    conc_impulse_sx: concImpulseSX,
    concImpulseDX,
    conc_impulse_dx: concImpulseDX,
    concImpulseAsym: parseValAllowZero(newValData.conc_impulse_asym_calculated ?? newValData.concImpulseAsym),

    // CMJ Monopodalico
    slCmjHeightSX,
    slCmjHeightDX,
    slCmjCtSX: parseVal(newValData.sl_cmj_ct_sx ?? newValData.slCmjCtSX),
    slCmjCtDX: parseVal(newValData.sl_cmj_ct_dx ?? newValData.slCmjCtDX),
    slCmjPeakPowerSX: parseVal(newValData.sl_cmj_peak_power_sx ?? newValData.slCmjPeakPowerSX),
    slCmjPeakPowerDX: parseVal(newValData.sl_cmj_peak_power_dx ?? newValData.slCmjPeakPowerDX),
    slCmjRsiSX: parseVal(newValData.sl_cmj_rsi_sx ?? newValData.slCmjRsiSX),
    slCmjRsiDX: parseVal(newValData.sl_cmj_rsi_dx ?? newValData.slCmjRsiDX),
    slCmjDepthSX: parseVal(newValData.sl_cmj_depth_sx ?? newValData.slCmjDepthSX),
    slCmjDepthDX: parseVal(newValData.sl_cmj_depth_dx ?? newValData.slCmjDepthDX),
    slCmjEccImpulseSX: parseVal(newValData.sl_cmj_ecc_impulse_sx ?? newValData.slCmjEccImpulseSX),
    slCmjEccImpulseDX: parseVal(newValData.sl_cmj_ecc_impulse_dx ?? newValData.slCmjEccImpulseDX),
    slCmjHeightLsi,
    slCmjDepthLsi: parseVal(newValData.lsi_sl_cmj_depth_calculated ?? newValData.slCmjDepthLsi),

    // Drop Jump Bilaterale
    djBoxHeight: hasDjData ? (newValData.dj_box_height || newValData.djBoxHeight || '30 cm') : null,
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
    djBrakingForce: parseVal(newValData.dj_braking_force ?? newValData.djBrakingForce),
    djBrakingImpulse: parseVal(newValData.dj_braking_impulse ?? newValData.djBrakingImpulse),
    djValidationStatus,
    djFailReason,

    // Drop Jump Monopodalico
    slDjBoxHeight: hasSlDjData ? (newValData.sl_dj_box_height || newValData.slDjBoxHeight || '30 cm') : null,
    slDjCtSX,
    slDjCtDX,
    slDjRsiSX,
    slDjRsiDX,
    slDjHeightSX,
    slDjHeightDX,
    slDjBrakingSX,
    slDjBrakingDX,
    slDjRsiLsi: parseVal(newValData.lsi_sl_dj_rsi_calculated ?? newValData.slDjRsiLsi)
  };

  return newTest;
};

/**
 * Unisce (merge) un nuovo inserimento di singolo test dentro una Sessione di Valutazione esistente.
 * I campi `null` del nuovo inserimento NON sovrascrivono i test già presenti nella sessione.
 */
export function mergeTestIntoSession(existingSession, newPartialData, patientId) {
  const base = existingSession || {};
  const incoming = createTestObject(newPartialData, patientId || base.patient_id, base.num || 1);

  const pickNonNull = (newVal, oldVal) => {
    if (newVal !== null && newVal !== undefined && newVal !== '' && newVal !== '-') {
      return newVal;
    }
    return oldVal !== undefined && oldVal !== '' && oldVal !== '-' ? oldVal : null;
  };

  const mergedCustomMetrics = mergeCustomMetricsMaps(base.custom_metrics, incoming.custom_metrics);

  const mergedRaw = {
    ...base,
    id: base.id || incoming.id,
    patient_id: patientId || base.patient_id,
    patientId: patientId || base.patientId,
    num: base.num || incoming.num,
    session_id: base.session_id || incoming.session_id,
    session_name: newPartialData.session_name || base.session_name || base.label || incoming.label,
    label: newPartialData.session_name || base.session_name || base.label || incoming.label,
    data_valutazione: newPartialData.data_valutazione || base.data_valutazione || incoming.data_valutazione,
    ginocchio_operato: newPartialData.ginocchio_operato || base.ginocchio_operato || 'DX',
    fase_riabilitativa: newPartialData.fase_riabilitativa || base.fase_riabilitativa,
    valutatore: newPartialData.valutatore || base.valutatore,
    module_dates: {
      ...(base.module_dates || {}),
      ...(incoming.module_dates || {})
    },
    custom_metrics: mergedCustomMetrics,

    iso_leg_ext_sx: pickNonNull(incoming.quadSano, base.quadSano ?? base.iso_leg_ext_sx),
    iso_leg_ext_dx: pickNonNull(incoming.quadOp, base.quadOp ?? base.iso_leg_ext_dx),
    iso_leg_curl_sx: pickNonNull(incoming.flexSano, base.flexSano ?? base.iso_leg_curl_sx),
    iso_leg_curl_dx: pickNonNull(incoming.flexOp, base.flexOp ?? base.iso_leg_curl_dx),
    calf_raise_sx: pickNonNull(incoming.calfRaiseSX, base.calfRaiseSX),
    calf_raise_dx: pickNonNull(incoming.calfRaiseDX, base.calfRaiseDX),
    soleo_sx: pickNonNull(incoming.soleoSX, base.soleoSX),
    soleo_dx: pickNonNull(incoming.soleoDX, base.soleoDX),
    bulgarian_sx: pickNonNull(incoming.bulgarianSX, base.bulgarianSX),
    bulgarian_dx: pickNonNull(incoming.bulgarianDX, base.bulgarianDX),
    imtp_peak_force: pickNonNull(incoming.imtpForce, base.imtpForce),
    ikdc_score: pickNonNull(incoming.ikdc, base.ikdc ?? base.ikdc_score),
    aclrsi: pickNonNull(incoming.aclrsi, base.aclrsi),
    lsi_single_hop: pickNonNull(incoming.lsiSingleHop, base.lsiSingleHop),
    lsi_triple_hop: pickNonNull(incoming.lsiTripleHop, base.lsiTripleHop),

    jump_height_cm: pickNonNull(incoming.jumpHeight, base.jumpHeight ?? base.jump_height_cm),
    contraction_time_ms: pickNonNull(incoming.contractionTime, base.contractionTime ?? base.contraction_time_ms),
    peak_power_w: pickNonNull(incoming.peakPower, base.peakPower ?? base.peak_power_w),
    cmj_depth: pickNonNull(incoming.cmjDepth, base.cmjDepth ?? base.cmj_depth),
    ecc_braking_rfd: pickNonNull(incoming.eccBrakingRfd, base.eccBrakingRfd ?? base.ecc_braking_rfd),
    ecc_braking_sx: pickNonNull(incoming.eccBrakingSX, base.eccBrakingSX ?? base.ecc_braking_sx),
    ecc_braking_dx: pickNonNull(incoming.eccBrakingDX, base.eccBrakingDX ?? base.ecc_braking_dx),
    conc_impulse_sx: pickNonNull(incoming.concImpulseSX, base.concImpulseSX ?? base.conc_impulse_sx),
    conc_impulse_dx: pickNonNull(incoming.concImpulseDX, base.concImpulseDX ?? base.conc_impulse_dx),

    sl_cmj_height_sx: pickNonNull(incoming.slCmjHeightSX, base.slCmjHeightSX),
    sl_cmj_height_dx: pickNonNull(incoming.slCmjHeightDX, base.slCmjHeightDX),
    sl_cmj_ct_sx: pickNonNull(incoming.slCmjCtSX, base.slCmjCtSX),
    sl_cmj_ct_dx: pickNonNull(incoming.slCmjCtDX, base.slCmjCtDX),
    sl_cmj_peak_power_sx: pickNonNull(incoming.slCmjPeakPowerSX, base.slCmjPeakPowerSX),
    sl_cmj_peak_power_dx: pickNonNull(incoming.slCmjPeakPowerDX, base.slCmjPeakPowerDX),
    sl_cmj_rsi_sx: pickNonNull(incoming.slCmjRsiSX, base.slCmjRsiSX),
    sl_cmj_rsi_dx: pickNonNull(incoming.slCmjRsiDX, base.slCmjRsiDX),
    sl_cmj_depth_sx: pickNonNull(incoming.slCmjDepthSX, base.slCmjDepthSX),
    sl_cmj_depth_dx: pickNonNull(incoming.slCmjDepthDX, base.slCmjDepthDX),
    sl_cmj_ecc_impulse_sx: pickNonNull(incoming.slCmjEccImpulseSX, base.slCmjEccImpulseSX),
    sl_cmj_ecc_impulse_dx: pickNonNull(incoming.slCmjEccImpulseDX, base.slCmjEccImpulseDX),

    dj_box_height: pickNonNull(incoming.djBoxHeight, base.djBoxHeight),
    dj_jump_height: pickNonNull(incoming.djJumpHeight, base.djJumpHeight),
    dj_contact_time: pickNonNull(incoming.djContactTime, base.djContactTime),
    dj_rsi: pickNonNull(incoming.rsiDropJump, base.rsiDropJump),
    dj_ttpf_ms: pickNonNull(incoming.djTtpfMs, base.djTtpfMs),
    dj_takeoff_asym_ms: pickNonNull(incoming.djTakeoffAsymMs, base.djTakeoffAsymMs),
    dj_landing_peak_sx: pickNonNull(incoming.djLandingPeakSX, base.djLandingPeakSX),
    dj_landing_peak_dx: pickNonNull(incoming.djLandingPeakDX, base.djLandingPeakDX),
    dj_conc_impulse_sx: pickNonNull(incoming.djConcImpulseSX, base.djConcImpulseSX),
    dj_conc_impulse_dx: pickNonNull(incoming.djConcImpulseDX, base.djConcImpulseDX),
    dj_braking_force: pickNonNull(incoming.djBrakingForce, base.djBrakingForce),
    dj_braking_impulse: pickNonNull(incoming.djBrakingImpulse, base.djBrakingImpulse),

    sl_dj_box_height: pickNonNull(incoming.slDjBoxHeight, base.slDjBoxHeight),
    sl_dj_ct_sx: pickNonNull(incoming.slDjCtSX, base.slDjCtSX),
    sl_dj_ct_dx: pickNonNull(incoming.slDjCtDX, base.slDjCtDX),
    sl_dj_rsi_sx: pickNonNull(incoming.slDjRsiSX, base.slDjRsiSX),
    sl_dj_rsi_dx: pickNonNull(incoming.slDjRsiDX, base.slDjRsiDX),
    sl_dj_height_sx: pickNonNull(incoming.slDjHeightSX, base.slDjHeightSX),
    sl_dj_height_dx: pickNonNull(incoming.slDjHeightDX, base.slDjHeightDX),
    sl_dj_braking_sx: pickNonNull(incoming.slDjBrakingSX, base.slDjBrakingSX),
    sl_dj_braking_dx: pickNonNull(incoming.slDjBrakingDX, base.slDjBrakingDX)
  };

  return createTestObject(mergedRaw, patientId || base.patient_id, base.num || 1);
}

/**
 * Raggruppa automaticamente test eseguiti in date diverse (entro una finestra di `windowDays`, default 14 giorni,
 * oppure con lo stesso `session_id` / `session_name`) in Sessioni / Report clinici unificati.
 */
export function aggregateTestsIntoSessions(tests, windowDays = 14) {
  const sorted = sortTestsByDate(tests);
  if (sorted.length <= 1) return sorted;

  const groupedSessions = [];
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  for (const t of sorted) {
    const tTime = getTestTimestamp(t);
    const lastSession = groupedSessions[groupedSessions.length - 1];

    if (!lastSession) {
      groupedSessions.push({
        ...t,
        aggregatedCount: 1,
        dateRange: t.date
      });
      continue;
    }

    const lastTime = getTestTimestamp(lastSession);
    const sameExplicitSession =
      (t.session_id && lastSession.session_id && t.session_id === lastSession.session_id) ||
      (t.session_name &&
        lastSession.session_name &&
        !t.session_name.startsWith('Test #') &&
        t.session_name === lastSession.session_name);

    const withinTimeWindow =
      tTime > 0 && lastTime > 0 && Math.abs(tTime - lastTime) <= windowMs;

    if (sameExplicitSession || withinTimeWindow) {
      const merged = mergeTestIntoSession(lastSession, t, t.patient_id || lastSession.patient_id);
      const firstDate = lastSession.firstDate || lastSession.date;
      const lastDate = t.date;
      const dateRange =
        firstDate && lastDate && firstDate !== lastDate
          ? `${firstDate} → ${lastDate}`
          : lastDate || firstDate;

      groupedSessions[groupedSessions.length - 1] = {
        ...merged,
        id: lastSession.id,
        firstDate,
        date: lastDate || merged.date,
        dateRange,
        aggregatedCount: (lastSession.aggregatedCount || 1) + 1,
        session_name:
          (t.session_name && !t.session_name.startsWith('Test #') ? t.session_name : null) ||
          (lastSession.session_name && !lastSession.session_name.startsWith('Test #')
            ? lastSession.session_name
            : lastSession.label)
      };
    } else {
      groupedSessions.push({
        ...t,
        firstDate: t.date,
        dateRange: t.date,
        aggregatedCount: 1
      });
    }
  }

  return sortTestsByDate(groupedSessions);
}

export async function saveTestToSupabase(newTest) {
  if (!isSupabaseConfigured) return;
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .upsert([newTest], { onConflict: 'id' });
    if (error) {
      console.warn('Info salvataggio Supabase evaluations:', error.message);
    } else {
      console.log('Test salvato con successo su Supabase evaluations:', data);
    }
  } catch (err) {
    console.warn('Eccezione Supabase evaluations:', err);
  }
}

/**
 * Ricava il timestamp Unix in ms dalla data del test (data_valutazione, date o created_at)
 */
export function getTestTimestamp(t) {
  if (!t) return 0;
  if (t.data_valutazione && typeof t.data_valutazione === 'string') {
    const d = new Date(t.data_valutazione);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  if (t.date && typeof t.date === 'string') {
    if (t.date.includes('/')) {
      const cleanDate = t.date.split('→')[0].trim();
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d.getTime();
      }
    } else if (t.date.includes('-')) {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  }
  if (t.created_at) {
    const d = new Date(t.created_at);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return 0;
}

/**
 * Ordina automaticamente una lista di test in ordine CRONOLOGICO CRESCENTE per data di esecuzione.
 * Ricalcola numeri di test, etichette e delta LSI ignorando rigorosamente i valori null/0.
 */
export function sortTestsByDate(tests) {
  if (!Array.isArray(tests)) return [];
  const flat = tests.flat(Infinity).filter(t => t && typeof t === 'object' && !Array.isArray(t));
  if (flat.length === 0) return [];

  const sorted = [...flat].sort((a, b) => getTestTimestamp(a) - getTestTimestamp(b));

  return sorted.map((t, idx) => {
    const num = idx + 1;
    let label = t.session_name || t.label;
    if (!label || /^Test #\d+$/.test(label)) {
      label = `Test #${num}`;
    }

    let lsiQuadDelta = null;
    let lsiFlexDelta = null;

    const curQuad = extractMetricFromSingleTest(t, ['lsiQuad', 'lsi_quad_calculated']);
    if (curQuad !== null && idx > 0) {
      for (let p = idx - 1; p >= 0; p--) {
        const prevQuad = extractMetricFromSingleTest(sorted[p], ['lsiQuad', 'lsi_quad_calculated']);
        if (prevQuad !== null && prevQuad > 0) {
          const diff = (curQuad - prevQuad).toFixed(1);
          lsiQuadDelta = Number(diff) >= 0 ? `+${diff}%` : `${diff}%`;
          break;
        }
      }
    }

    const curFlex = extractMetricFromSingleTest(t, ['lsiFlex', 'lsi_curl_calculated']);
    if (curFlex !== null && idx > 0) {
      for (let p = idx - 1; p >= 0; p--) {
        const prevFlex = extractMetricFromSingleTest(sorted[p], ['lsiFlex', 'lsi_curl_calculated']);
        if (prevFlex !== null && prevFlex > 0) {
          const diff = (curFlex - prevFlex).toFixed(1);
          lsiFlexDelta = Number(diff) >= 0 ? `+${diff}%` : `${diff}%`;
          break;
        }
      }
    }

    return {
      ...t,
      num,
      label,
      custom_metrics: sanitizeCustomMetricsMap(t.custom_metrics),
      lsiQuad: curQuad ?? toStrictNullOrNumber(t.lsiQuad),
      lsiFlex: curFlex ?? toStrictNullOrNumber(t.lsiFlex),
      lsiQuadDelta,
      lsiFlexDelta
    };
  });
}
