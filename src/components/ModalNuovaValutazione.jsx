import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Flame,
  Zap,
  Activity,
  Plus,
  Dumbbell,
  Box,
  Layers,
  Calendar,
  FolderPlus,
  Link2,
  ClipboardCheck,
  Sparkles,
  Sliders,
  Trash2,
  ChevronDown
} from 'lucide-react';
import {
  sortTestsByDate,
  getTestTimestamp,
  toStrictNullOrNumber,
  normalizeTestTypeCode,
  fetchCustomMetricDefinitions,
  fetchPatientPreviousCustomMetrics,
  saveCustomMetricsToSupabase,
  hideCustomMetricInSupabase
} from '../utils/testUtils';

const TEST_MODULES = [
  {
    id: 'ISO_EXT',
    testType: 'ISO_PUSH_LEG_EXT',
    title: 'Iso Push Leg Ext',
    subtitle: 'Quadricipite SX/DX & LSI',
    category: 'Forza Isometrica',
    icon: Flame,
    fields: ['legExtSX', 'legExtDX']
  },
  {
    id: 'ISO_CURL',
    testType: 'ISO_PUSH_LEG_CURL',
    title: 'Iso Push Leg Curl',
    subtitle: 'Ischiocrurali SX/DX & H/Q',
    category: 'Forza Isometrica',
    icon: Flame,
    fields: ['legCurlSX', 'legCurlDX']
  },
  {
    id: 'FORZA_DINAMICA',
    testType: 'FORZA_ACCESSORIA',
    title: 'Forza Accessoria & IMTP',
    subtitle: 'Bulgarian, Calf, Soleo, IMTP',
    category: 'Forza Dinamica',
    icon: Dumbbell,
    fields: ['bulgarianSX', 'bulgarianDX', 'calfRaiseSX', 'calfRaiseDX', 'soleoSX', 'soleoDX', 'imtpPeakForce']
  },
  {
    id: 'CMJ_BILATERAL',
    testType: 'CMJ_BILATERALE',
    title: 'CMJ Bilaterale',
    subtitle: 'Altezza, RSImod, Impulse L/R',
    category: 'Pliometria & Balistica',
    icon: Zap,
    fields: [
      'jumpHeight',
      'contractionTime',
      'peakPower',
      'cmjDepth',
      'eccBrakingRfd',
      'concImpulseSX',
      'concImpulseDX',
      'eccBrakingSX',
      'eccBrakingDX'
    ]
  },
  {
    id: 'CMJ_SL',
    testType: 'CMJ_MONOPODALICO',
    title: 'CMJ Monopodalico',
    subtitle: 'Single Leg Jump SX vs DX',
    category: 'Simmetria Balistica',
    icon: Activity,
    fields: [
      'slCmjHeightSX',
      'slCmjHeightDX',
      'slCmjPeakPowerSX',
      'slCmjPeakPowerDX',
      'slCmjRsiSX',
      'slCmjRsiDX',
      'slCmjDepthSX',
      'slCmjDepthDX'
    ]
  },
  {
    id: 'DJ_BILATERAL',
    testType: 'RSI_DROP_JUMP',
    title: 'RSI Drop Jump',
    subtitle: 'GCT <250ms, RSI & Force Plates',
    category: 'Reattività Bipodalica',
    icon: Box,
    fields: [
      'djJumpHeight',
      'djContactTime',
      'djRSI',
      'djTtpfMs',
      'djTakeoffAsymMs',
      'djLandingPeakSX',
      'djLandingPeakDX',
      'djConcImpulseSX',
      'djConcImpulseDX'
    ]
  },
  {
    id: 'DJ_SL',
    testType: 'SL_DROP_JUMP',
    title: 'SL Drop Jump',
    subtitle: 'Reattività Monopodalica SX/DX',
    category: 'Reattività Monopodalica',
    icon: Zap,
    fields: [
      'slDjCtSX',
      'slDjCtDX',
      'slDjRsiSX',
      'slDjRsiDX',
      'slDjHeightSX',
      'slDjHeightDX',
      'slDjBrakingSX',
      'slDjBrakingDX'
    ]
  },
  {
    id: 'CLINICAL_SCORES',
    testType: 'SCORE_CLINICI',
    title: 'Hop Test & Score Clinici',
    subtitle: 'IKDC, ACL-RSI, Single/Triple Hop',
    category: 'Clinica & Return to Sport',
    icon: ClipboardCheck,
    fields: ['ikdcScore', 'aclrsiScore', 'lsiSingleHop', 'lsiTripleHop']
  }
];

const EMPTY_FORM = {
  legExtSX: '',
  legExtDX: '',
  legCurlSX: '',
  legCurlDX: '',
  calfRaiseSX: '',
  calfRaiseDX: '',
  soleoSX: '',
  soleoDX: '',
  bulgarianSX: '',
  bulgarianDX: '',
  imtpPeakForce: '',

  jumpHeight: '',
  contractionTime: '',
  peakPower: '',
  cmjDepth: '',
  eccBrakingRfd: '',
  eccBrakingSX: '',
  eccBrakingDX: '',
  concImpulseSX: '',
  concImpulseDX: '',

  slCmjHeightSX: '',
  slCmjHeightDX: '',
  slCmjCtSX: '',
  slCmjCtDX: '',
  slCmjPeakPowerSX: '',
  slCmjPeakPowerDX: '',
  slCmjRsiSX: '',
  slCmjRsiDX: '',
  slCmjDepthSX: '',
  slCmjDepthDX: '',
  slCmjEccImpulseSX: '',
  slCmjEccImpulseDX: '',

  djBoxHeight: '30 cm',
  djJumpHeight: '',
  djContactTime: '',
  djRSI: '',
  djTtpfMs: '',
  djTakeoffAsymMs: '',
  djLandingPeakSX: '',
  djLandingPeakDX: '',
  djConcImpulseSX: '',
  djConcImpulseDX: '',
  djBrakingForce: '',
  djBrakingImpulse: '',

  slDjBoxHeight: '30 cm',
  slDjCtSX: '',
  slDjCtDX: '',
  slDjRsiSX: '',
  slDjRsiDX: '',
  slDjHeightSX: '',
  slDjHeightDX: '',
  slDjBrakingSX: '',
  slDjBrakingDX: '',

  ikdcScore: '',
  aclrsiScore: '',
  lsiSingleHop: '',
  lsiTripleHop: ''
};

export default function ModalNuovaValutazione({
  isOpen,
  onClose,
  patient,
  onSaveEvaluation,
  initialData = null,
  initialModule = 'ISO_EXT'
}) {
  if (!isOpen || !patient) return null;

  const existingSessions = useMemo(() => {
    return sortTestsByDate(patient?.tests || []);
  }, [patient?.tests]);

  const recentSession = useMemo(() => {
    if (existingSessions.length === 0) return null;
    const last = existingSessions[existingSessions.length - 1];
    const lastTs = getTestTimestamp(last);
    const nowTs = Date.now();
    const diffDays = (nowTs - lastTs) / (1000 * 60 * 60 * 24);
    if (diffDays >= -2 && diffDays <= 14) {
      return last;
    }
    return null;
  }, [existingSessions]);

  const [selectedModule, setSelectedModule] = useState(initialModule || 'ISO_EXT');
  const [sessionMode, setSessionMode] = useState('NEW');
  const [targetSessionId, setTargetSessionId] = useState('');
  const [sessionName, setSessionName] = useState('');

  const [opKnee, setOpKnee] = useState(
    patient.lato_lesione === 'Sx' || patient.lato_lesione === 'SX' ? 'SX' : 'DX'
  );
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [phase, setPhase] = useState(patient.fase_riabilitativa || 'Fase 3 (3-6 mesi)');
  const [evaluator, setEvaluator] = useState('N Rehab Team');
  const [form, setForm] = useState(EMPTY_FORM);
  const [savedToast, setSavedToast] = useState('');

  // =========================================================================
  // STATO SISTEMA DI METRICHE DINAMICHE E PERSONALIZZATE
  // =========================================================================
  // Mappa: { [test_type]: [{ metric_name, unit, metric_value, is_hidden }] }
  const [customMetricsByType, setCustomMetricsByType] = useState({});
  // Suggerimenti globali da `custom_metric_definitions` per il `test_type` attivo
  const [globalMetricSuggestions, setGlobalMetricSuggestions] = useState([]);
  // Indice della riga metrica che ha il menu suggerimenti aperto (-1 = nessuno)
  const [openSuggestionRowIdx, setOpenSuggestionRowIdx] = useState(-1);

  const activeModuleDef = TEST_MODULES.find(m => m.id === selectedModule) || TEST_MODULES[0];
  const activeTestType = normalizeTestTypeCode(activeModuleDef.testType || selectedModule);

  const getValStr = (...vals) => {
    for (const v of vals) {
      const clean = toStrictNullOrNumber(v, false);
      if (clean !== null) return String(clean);
    }
    return '';
  };

  const populateFormFromSession = (sessionObj) => {
    if (!sessionObj) {
      setForm(EMPTY_FORM);
      setCustomMetricsByType({});
      return;
    }
    setForm({
      legExtSX: getValStr(sessionObj.quadSano, sessionObj.legExtSX, sessionObj.iso_leg_ext_sx),
      legExtDX: getValStr(sessionObj.quadOp, sessionObj.legExtDX, sessionObj.iso_leg_ext_dx),
      legCurlSX: getValStr(sessionObj.flexSano, sessionObj.legCurlSX, sessionObj.iso_leg_curl_sx),
      legCurlDX: getValStr(sessionObj.flexOp, sessionObj.legCurlDX, sessionObj.iso_leg_curl_dx),
      calfRaiseSX: getValStr(sessionObj.calfRaiseSX, sessionObj.calf_raise_sx),
      calfRaiseDX: getValStr(sessionObj.calfRaiseDX, sessionObj.calf_raise_dx),
      soleoSX: getValStr(sessionObj.soleoSX, sessionObj.soleo_sx),
      soleoDX: getValStr(sessionObj.soleoDX, sessionObj.soleo_dx),
      bulgarianSX: getValStr(sessionObj.bulgarianSX, sessionObj.bulgarian_sx),
      bulgarianDX: getValStr(sessionObj.bulgarianDX, sessionObj.bulgarian_dx),
      imtpPeakForce: getValStr(sessionObj.imtpForce, sessionObj.imtpPeakForce, sessionObj.imtp_peak_force),

      jumpHeight: getValStr(sessionObj.jumpHeight, sessionObj.jump_height_cm, sessionObj.altezza_salto),
      contractionTime: getValStr(sessionObj.contractionTime, sessionObj.contraction_time_ms, sessionObj.tempo_contrazione),
      peakPower: getValStr(sessionObj.peakPower, sessionObj.peak_power_w, sessionObj.potenza_picco),
      cmjDepth: getValStr(sessionObj.cmjDepth, sessionObj.cmj_depth),
      eccBrakingRfd: getValStr(sessionObj.eccBrakingRfd, sessionObj.ecc_braking_rfd),
      eccBrakingSX: getValStr(sessionObj.eccBrakingSX, sessionObj.ecc_braking_sx),
      eccBrakingDX: getValStr(sessionObj.eccBrakingDX, sessionObj.ecc_braking_dx),
      concImpulseSX: getValStr(sessionObj.concImpulseSX, sessionObj.conc_impulse_sx),
      concImpulseDX: getValStr(sessionObj.concImpulseDX, sessionObj.conc_impulse_dx),

      slCmjHeightSX: getValStr(sessionObj.slCmjHeightSX, sessionObj.sl_cmj_height_sx),
      slCmjHeightDX: getValStr(sessionObj.slCmjHeightDX, sessionObj.sl_cmj_height_dx),
      slCmjCtSX: getValStr(sessionObj.slCmjCtSX, sessionObj.sl_cmj_ct_sx),
      slCmjCtDX: getValStr(sessionObj.slCmjCtDX, sessionObj.sl_cmj_ct_dx),
      slCmjPeakPowerSX: getValStr(sessionObj.slCmjPeakPowerSX, sessionObj.sl_cmj_peak_power_sx),
      slCmjPeakPowerDX: getValStr(sessionObj.slCmjPeakPowerDX, sessionObj.sl_cmj_peak_power_dx),
      slCmjRsiSX: getValStr(sessionObj.slCmjRsiSX, sessionObj.sl_cmj_rsi_sx),
      slCmjRsiDX: getValStr(sessionObj.slCmjRsiDX, sessionObj.sl_cmj_rsi_dx),
      slCmjDepthSX: getValStr(sessionObj.slCmjDepthSX, sessionObj.sl_cmj_depth_sx),
      slCmjDepthDX: getValStr(sessionObj.slCmjDepthDX, sessionObj.sl_cmj_depth_dx),
      slCmjEccImpulseSX: getValStr(sessionObj.slCmjEccImpulseSX, sessionObj.sl_cmj_ecc_impulse_sx),
      slCmjEccImpulseDX: getValStr(sessionObj.slCmjEccImpulseDX, sessionObj.sl_cmj_ecc_impulse_dx),

      djBoxHeight: sessionObj.djBoxHeight || sessionObj.dj_box_height || '30 cm',
      djJumpHeight: getValStr(sessionObj.djJumpHeight, sessionObj.dj_jump_height),
      djContactTime: getValStr(sessionObj.djContactTime, sessionObj.dj_contact_time),
      djRSI: getValStr(sessionObj.rsiDropJump, sessionObj.djRSI, sessionObj.dj_rsi),
      djTtpfMs: getValStr(sessionObj.djTtpfMs, sessionObj.dj_ttpf_ms),
      djTakeoffAsymMs: getValStr(sessionObj.djTakeoffAsymMs, sessionObj.dj_takeoff_asym_ms),
      djLandingPeakSX: getValStr(sessionObj.djLandingPeakSX, sessionObj.dj_landing_peak_sx),
      djLandingPeakDX: getValStr(sessionObj.djLandingPeakDX, sessionObj.dj_landing_peak_dx),
      djConcImpulseSX: getValStr(sessionObj.djConcImpulseSX, sessionObj.dj_conc_impulse_sx),
      djConcImpulseDX: getValStr(sessionObj.djConcImpulseDX, sessionObj.dj_conc_impulse_dx),
      djBrakingForce: getValStr(sessionObj.djBrakingForce, sessionObj.dj_braking_force),
      djBrakingImpulse: getValStr(sessionObj.djBrakingImpulse, sessionObj.dj_braking_impulse),

      slDjBoxHeight: sessionObj.slDjBoxHeight || sessionObj.sl_dj_box_height || '30 cm',
      slDjCtSX: getValStr(sessionObj.slDjCtSX, sessionObj.sl_dj_ct_sx),
      slDjCtDX: getValStr(sessionObj.slDjCtDX, sessionObj.sl_dj_ct_dx),
      slDjRsiSX: getValStr(sessionObj.slDjRsiSX, sessionObj.sl_dj_rsi_sx),
      slDjRsiDX: getValStr(sessionObj.slDjRsiDX, sessionObj.sl_dj_rsi_dx),
      slDjHeightSX: getValStr(sessionObj.slDjHeightSX, sessionObj.sl_dj_height_sx),
      slDjHeightDX: getValStr(sessionObj.slDjHeightDX, sessionObj.sl_dj_height_dx),
      slDjBrakingSX: getValStr(sessionObj.slDjBrakingSX, sessionObj.sl_dj_braking_sx),
      slDjBrakingDX: getValStr(sessionObj.slDjBrakingDX, sessionObj.sl_dj_braking_dx),

      ikdcScore: getValStr(sessionObj.ikdc, sessionObj.ikdc_score),
      aclrsiScore: getValStr(sessionObj.aclrsi, sessionObj.acl_rsi),
      lsiSingleHop: getValStr(sessionObj.lsiSingleHop, sessionObj.lsi_single_hop),
      lsiTripleHop: getValStr(sessionObj.lsiTripleHop, sessionObj.lsi_triple_hop)
    });

    if (sessionObj.custom_metrics && typeof sessionObj.custom_metrics === 'object') {
      const cloned = {};
      Object.entries(sessionObj.custom_metrics).forEach(([k, arr]) => {
        if (Array.isArray(arr)) {
          cloned[normalizeTestTypeCode(k)] = arr.map(m => ({
            metric_name: m.metric_name || '',
            unit: m.unit || '',
            metric_value: m.metric_value !== null && m.metric_value !== undefined ? String(m.metric_value) : '',
            is_hidden: Boolean(m.is_hidden)
          }));
        }
      });
      setCustomMetricsByType(cloned);
    } else {
      setCustomMetricsByType({});
    }
  };

  useEffect(() => {
    setSelectedModule(initialModule || 'ISO_EXT');
    setSavedToast('');
    setOpenSuggestionRowIdx(-1);

    if (initialData) {
      setSessionMode('EXISTING');
      setTargetSessionId(initialData.id);
      setSessionName(initialData.session_name || initialData.label || `Valutazione #${initialData.num || 1}`);
      setEvalDate(initialData.data_valutazione || new Date().toISOString().split('T')[0]);
      setPhase(initialData.fase_riabilitativa || patient?.fase_riabilitativa || 'Fase 3 (3-6 mesi)');
      setEvaluator(initialData.valutatore || 'N Rehab Team');
      if (initialData.ginocchio_operato) setOpKnee(initialData.ginocchio_operato);
      populateFormFromSession(initialData);
    } else if (recentSession) {
      setSessionMode('EXISTING');
      setTargetSessionId(recentSession.id);
      setSessionName(recentSession.session_name || recentSession.label || `Sessione #${recentSession.num}`);
      setEvalDate(new Date().toISOString().split('T')[0]);
      setPhase(patient?.fase_riabilitativa || 'Fase 3 (3-6 mesi)');
      setEvaluator('N Rehab Team');
      populateFormFromSession(recentSession);
    } else {
      setSessionMode('NEW');
      setTargetSessionId('');
      const nextNum = existingSessions.length + 1;
      setSessionName(`Valutazione #${nextNum}`);
      setEvalDate(new Date().toISOString().split('T')[0]);
      setPhase(patient?.fase_riabilitativa || 'Fase 3 (3-6 mesi)');
      setEvaluator('N Rehab Team');
      setForm(EMPTY_FORM);
      setCustomMetricsByType({});
    }
  }, [initialData, patient, isOpen]);

  // Carica suggerimenti da `custom_metric_definitions` e pre-popola le metriche già usate dal paziente per questo `test_type`
  useEffect(() => {
    let isMounted = true;

    async function loadSuggestionsAndPatientHistory() {
      const [defs, prevPatientMetrics] = await Promise.all([
        fetchCustomMetricDefinitions(activeTestType),
        fetchPatientPreviousCustomMetrics(patient, activeTestType)
      ]);

      if (!isMounted) return;
      setGlobalMetricSuggestions(defs || []);

      if (Array.isArray(prevPatientMetrics) && prevPatientMetrics.length > 0) {
        setCustomMetricsByType(prev => {
          const currentList = Array.isArray(prev[activeTestType]) ? [...prev[activeTestType]] : [];
          const existingNames = new Set(currentList.map(m => (m.metric_name || '').trim().toLowerCase()));
          let changed = false;

          prevPatientMetrics.forEach(pm => {
            const key = (pm.metric_name || '').trim().toLowerCase();
            if (key && !existingNames.has(key)) {
              currentList.push({
                metric_name: pm.metric_name,
                unit: pm.unit || '',
                metric_value: '',
                is_hidden: false,
                isPreloadedFromHistory: true
              });
              existingNames.add(key);
              changed = true;
            }
          });

          return changed ? { ...prev, [activeTestType]: currentList } : prev;
        });
      }
    }

    loadSuggestionsAndPatientHistory();
    return () => {
      isMounted = false;
    };
  }, [activeTestType, patient]);

  const handleSelectSessionMode = (mode, sessId = '') => {
    setSessionMode(mode);
    if (mode === 'EXISTING') {
      const chosenId = sessId || recentSession?.id || existingSessions[existingSessions.length - 1]?.id || '';
      setTargetSessionId(chosenId);
      const found = existingSessions.find(s => s.id === chosenId);
      if (found) {
        setSessionName(found.session_name || found.label || `Sessione #${found.num}`);
        populateFormFromSession(found);
      }
    } else {
      setTargetSessionId('');
      const nextNum = existingSessions.length + 1;
      setSessionName(`Valutazione #${nextNum}`);
      setForm(EMPTY_FORM);
      setCustomMetricsByType({});
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Gestione Metriche Personalizzate per il `test_type` attivo
  const activeCustomMetrics = (customMetricsByType[activeTestType] || []).filter(m => !m.is_hidden);

  const handleAddCustomMetricRow = () => {
    setCustomMetricsByType(prev => {
      const list = Array.isArray(prev[activeTestType]) ? [...prev[activeTestType]] : [];
      const newIndex = list.length;
      list.push({
        metric_name: '',
        unit: '',
        metric_value: '',
        is_hidden: false
      });
      setOpenSuggestionRowIdx(newIndex);
      return { ...prev, [activeTestType]: list };
    });
  };

  const handleUpdateCustomMetricRow = (visibleIdx, field, val) => {
    setCustomMetricsByType(prev => {
      const fullList = Array.isArray(prev[activeTestType]) ? [...prev[activeTestType]] : [];
      let vCount = -1;
      const updated = fullList.map(item => {
        if (item.is_hidden) return item;
        vCount++;
        if (vCount === visibleIdx) {
          const nextItem = { ...item, [field]: val };
          // Se digita o seleziona un nome che corrisponde a un suggerimento, auto-compila l'unità se vuota
          if (field === 'metric_name' && !nextItem.unit) {
            const matchedSug = globalMetricSuggestions.find(
              s => s.metric_name.toLowerCase() === String(val).trim().toLowerCase()
            );
            if (matchedSug?.unit) {
              nextItem.unit = matchedSug.unit;
            }
          }
          return nextItem;
        }
        return item;
      });
      return { ...prev, [activeTestType]: updated };
    });
  };

  const handleSelectSuggestion = (visibleIdx, suggestion) => {
    setCustomMetricsByType(prev => {
      const fullList = Array.isArray(prev[activeTestType]) ? [...prev[activeTestType]] : [];
      let vCount = -1;
      const updated = fullList.map(item => {
        if (item.is_hidden) return item;
        vCount++;
        if (vCount === visibleIdx) {
          return {
            ...item,
            metric_name: suggestion.metric_name,
            unit: suggestion.unit || item.unit || ''
          };
        }
        return item;
      });
      return { ...prev, [activeTestType]: updated };
    });
    setOpenSuggestionRowIdx(-1);
  };

  const handleHideOrRemoveCustomMetric = async (visibleIdx, metricObj) => {
    setCustomMetricsByType(prev => {
      const fullList = Array.isArray(prev[activeTestType]) ? [...prev[activeTestType]] : [];
      let vCount = -1;
      const updated = [];
      for (const item of fullList) {
        if (!item.is_hidden) {
          vCount++;
          if (vCount === visibleIdx) {
            // Se aveva un nome già registrato, lo marca is_hidden = true per nasconderlo anche dallo storico
            if (item.metric_name && item.metric_name.trim() !== '') {
              updated.push({ ...item, is_hidden: true, metric_value: null });
            }
            continue;
          }
        }
        updated.push(item);
      }
      return { ...prev, [activeTestType]: updated };
    });

    if (metricObj?.metric_name && patient?.id) {
      await hideCustomMetricInSupabase(patient.id, activeTestType, metricObj.metric_name);
    }
  };

  const parseVal = (val, allowZero = false) => toStrictNullOrNumber(val, allowZero);

  const computeLSI = (valSX, valDX) => {
    const numSX = parseVal(valSX);
    const numDX = parseVal(valDX);
    if (numSX === null || numDX === null || numSX <= 0 || numDX <= 0) return null;
    const opVal = opKnee === 'DX' ? numDX : numSX;
    const sanoVal = opKnee === 'DX' ? numSX : numDX;
    if (sanoVal <= 0) return null;
    return parseFloat(((opVal / sanoVal) * 100).toFixed(1));
  };

  const computeLimbAsym = (valSX, valDX) => {
    const numSX = parseVal(valSX);
    const numDX = parseVal(valDX);
    if (numSX === null || numDX === null || numSX <= 0 || numDX <= 0) return null;
    const opVal = opKnee === 'DX' ? numDX : numSX;
    const sanoVal = opKnee === 'DX' ? numSX : numDX;
    if (sanoVal <= 0) return null;
    return parseFloat((((sanoVal - opVal) / sanoVal) * 100).toFixed(1));
  };

  const computeRSImod = (jumpHeightCm, contractionTimeMs) => {
    const jh = parseVal(jumpHeightCm);
    const ct = parseVal(contractionTimeMs);
    if (jh === null || ct === null || ct <= 0) return null;
    return parseFloat(((jh / 100) / (ct / 1000)).toFixed(2));
  };

  const getModuleFilledCount = (moduleObj) => {
    const stdCount = moduleObj.fields.filter(f => parseVal(form[f]) !== null).length;
    const tType = normalizeTestTypeCode(moduleObj.testType || moduleObj.id);
    const custCount = (customMetricsByType[tType] || []).filter(
      m => !m.is_hidden && m.metric_name?.trim() && parseVal(m.metric_value, true) !== null
    ).length;
    return stdCount + custCount;
  };

  const buildSanitizedPayload = () => {
    const existingTarget =
      sessionMode === 'EXISTING'
        ? existingSessions.find(s => s.id === targetSessionId) || initialData
        : null;

    const hasDjFields =
      parseVal(form.djJumpHeight) !== null ||
      parseVal(form.djContactTime) !== null ||
      parseVal(form.djRSI) !== null ||
      parseVal(form.djTtpfMs) !== null ||
      parseVal(form.djTakeoffAsymMs, true) !== null ||
      parseVal(form.djLandingPeakSX) !== null ||
      parseVal(form.djConcImpulseSX) !== null;

    const hasSlDjFields =
      parseVal(form.slDjCtSX) !== null ||
      parseVal(form.slDjCtDX) !== null ||
      parseVal(form.slDjRsiSX) !== null ||
      parseVal(form.slDjRsiDX) !== null ||
      parseVal(form.slDjHeightSX) !== null ||
      parseVal(form.slDjHeightDX) !== null ||
      parseVal(form.slDjBrakingSX) !== null ||
      parseVal(form.slDjBrakingDX) !== null;

    // Sanitizza le metriche personalizzate (valori vuoti -> null)
    const sanitizedCustomMap = {};
    Object.entries(customMetricsByType).forEach(([tType, list]) => {
      if (!Array.isArray(list)) return;
      const cleanItems = list
        .filter(m => m && typeof m.metric_name === 'string' && m.metric_name.trim() !== '')
        .map(m => ({
          metric_name: m.metric_name.trim(),
          unit: m.unit ? m.unit.trim() : '',
          metric_value: parseVal(m.metric_value, true),
          is_hidden: Boolean(m.is_hidden)
        }));
      if (cleanItems.length > 0) {
        sanitizedCustomMap[normalizeTestTypeCode(tType)] = cleanItems;
      }
    });

    return {
      patient_id: patient?.id,
      patientId: patient?.id,
      id: existingTarget?.id || undefined,
      session_id: existingTarget?.session_id || existingTarget?.id || undefined,
      session_name: sessionName.trim() || existingTarget?.session_name || `Valutazione #${existingSessions.length + 1}`,
      label: sessionName.trim() || existingTarget?.label || `Valutazione #${existingSessions.length + 1}`,
      num: existingTarget?.num || existingSessions.length + 1,
      test_module: selectedModule,
      module_dates: existingTarget?.module_dates || {},
      custom_metrics: sanitizedCustomMap,
      data_valutazione: evalDate,
      ginocchio_operato: opKnee,
      fase_riabilitativa: phase,
      valutatore: evaluator,

      iso_leg_ext_sx: parseVal(form.legExtSX),
      iso_leg_ext_dx: parseVal(form.legExtDX),
      iso_leg_curl_sx: parseVal(form.legCurlSX),
      iso_leg_curl_dx: parseVal(form.legCurlDX),
      calf_raise_sx: parseVal(form.calfRaiseSX),
      calf_raise_dx: parseVal(form.calfRaiseDX),
      soleo_sx: parseVal(form.soleoSX),
      soleo_dx: parseVal(form.soleoDX),
      bulgarian_sx: parseVal(form.bulgarianSX),
      bulgarian_dx: parseVal(form.bulgarianDX),
      imtp_peak_force: parseVal(form.imtpPeakForce),

      jump_height_cm: parseVal(form.jumpHeight),
      contraction_time_ms: parseVal(form.contractionTime),
      peak_power_w: parseVal(form.peakPower),
      cmj_depth: parseVal(form.cmjDepth),
      ecc_braking_rfd: parseVal(form.eccBrakingRfd),
      rsi_cmj: computeRSImod(form.jumpHeight, form.contractionTime),
      ecc_braking_sx: parseVal(form.eccBrakingSX),
      ecc_braking_dx: parseVal(form.eccBrakingDX),
      conc_impulse_sx: parseVal(form.concImpulseSX),
      conc_impulse_dx: parseVal(form.concImpulseDX),

      sl_cmj_height_sx: parseVal(form.slCmjHeightSX),
      sl_cmj_height_dx: parseVal(form.slCmjHeightDX),
      sl_cmj_ct_sx: parseVal(form.slCmjCtSX),
      sl_cmj_ct_dx: parseVal(form.slCmjCtDX),
      sl_cmj_peak_power_sx: parseVal(form.slCmjPeakPowerSX),
      sl_cmj_peak_power_dx: parseVal(form.slCmjPeakPowerDX),
      sl_cmj_rsi_sx: parseVal(form.slCmjRsiSX) ?? computeRSImod(form.slCmjHeightSX, form.slCmjCtSX),
      sl_cmj_rsi_dx: parseVal(form.slCmjRsiDX) ?? computeRSImod(form.slCmjHeightDX, form.slCmjCtDX),
      sl_cmj_depth_sx: parseVal(form.slCmjDepthSX),
      sl_cmj_depth_dx: parseVal(form.slCmjDepthDX),
      sl_cmj_ecc_impulse_sx: parseVal(form.slCmjEccImpulseSX),
      sl_cmj_ecc_impulse_dx: parseVal(form.slCmjEccImpulseDX),

      dj_box_height: hasDjFields ? form.djBoxHeight : null,
      dj_jump_height: parseVal(form.djJumpHeight),
      dj_contact_time: parseVal(form.djContactTime),
      dj_rsi: parseVal(form.djRSI) ?? computeRSImod(form.djJumpHeight, form.djContactTime),
      dj_ttpf_ms: parseVal(form.djTtpfMs),
      dj_takeoff_asym_ms: parseVal(form.djTakeoffAsymMs, true),
      dj_landing_peak_sx: parseVal(form.djLandingPeakSX),
      dj_landing_peak_dx: parseVal(form.djLandingPeakDX),
      dj_conc_impulse_sx: parseVal(form.djConcImpulseSX),
      dj_conc_impulse_dx: parseVal(form.djConcImpulseDX),
      dj_braking_force: parseVal(form.djBrakingForce),
      dj_braking_impulse: parseVal(form.djBrakingImpulse),

      sl_dj_box_height: hasSlDjFields ? form.slDjBoxHeight : null,
      sl_dj_ct_sx: parseVal(form.slDjCtSX),
      sl_dj_ct_dx: parseVal(form.slDjCtDX),
      sl_dj_rsi_sx: parseVal(form.slDjRsiSX),
      sl_dj_rsi_dx: parseVal(form.slDjRsiDX),
      sl_dj_height_sx: parseVal(form.slDjHeightSX),
      sl_dj_height_dx: parseVal(form.slDjHeightDX),
      sl_dj_braking_sx: parseVal(form.slDjBrakingSX),
      sl_dj_braking_dx: parseVal(form.slDjBrakingDX),

      ikdc_score: parseVal(form.ikdcScore),
      aclrsi: parseVal(form.aclrsiScore),
      lsi_single_hop: parseVal(form.lsiSingleHop),
      lsi_triple_hop: parseVal(form.lsiTripleHop),

      lsi_quad_calculated: computeLSI(form.legExtSX, form.legExtDX),
      lsi_curl_calculated: computeLSI(form.legCurlSX, form.legCurlDX),
      ecc_braking_asym_calculated: computeLimbAsym(form.eccBrakingSX, form.eccBrakingDX),
      conc_impulse_asym_calculated: computeLimbAsym(form.concImpulseSX, form.concImpulseDX),
      lsi_sl_cmj_height_calculated: computeLSI(form.slCmjHeightSX, form.slCmjHeightDX),
      lsi_sl_cmj_ct_calculated: computeLSI(form.slCmjCtSX, form.slCmjCtDX),
      lsi_sl_cmj_peak_power_calculated: computeLSI(form.slCmjPeakPowerSX, form.slCmjPeakPowerDX),
      lsi_sl_cmj_rsi_calculated: computeLSI(
        parseVal(form.slCmjRsiSX) ?? computeRSImod(form.slCmjHeightSX, form.slCmjCtSX),
        parseVal(form.slCmjRsiDX) ?? computeRSImod(form.slCmjHeightDX, form.slCmjCtDX)
      ),
      lsi_sl_cmj_ecc_impulse_calculated: computeLSI(form.slCmjEccImpulseSX, form.slCmjEccImpulseSX),
      lsi_sl_dj_ct_calculated: computeLSI(form.slDjCtSX, form.slDjCtDX),
      lsi_sl_dj_rsi_calculated: computeLSI(form.slDjRsiSX, form.slDjRsiDX),
      lsi_sl_dj_height_calculated: computeLSI(form.slDjHeightSX, form.slDjHeightDX),
      lsi_sl_dj_braking_calculated: computeLSI(form.slDjBrakingSX, form.slDjBrakingDX)
    };
  };

  const persistCustomMetricsToDb = async (payload) => {
    const customMap = payload.custom_metrics || {};
    for (const [tType, list] of Object.entries(customMap)) {
      if (Array.isArray(list) && list.length > 0) {
        await saveCustomMetricsToSupabase({
          patientId: patient?.id,
          evaluationId: payload.id,
          sessionKey: payload.session_id || payload.session_name,
          testTypeInput: tType,
          customMetricsList: list
        });
      }
    }
  };

  const handleSaveAndKeepOpen = async () => {
    const payload = buildSanitizedPayload();
    await persistCustomMetricsToDb(payload);
    const activeModObj = TEST_MODULES.find(m => m.id === selectedModule);
    onSaveEvaluation(payload);
    setSavedToast(`✓ Modulo "${activeModObj?.title || 'Test'}" e metriche personalizzate salvati in "${payload.session_name}"!`);
    setTimeout(() => setSavedToast(''), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildSanitizedPayload();
    await persistCustomMetricsToDb(payload);
    onSaveEvaluation(payload);
    onClose();
  };

  const isOpDX = opKnee === 'DX';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto print:hidden">
      <div className="w-full max-w-5xl bg-slate-50 border border-slate-300/60 rounded-xl p-5 sm:p-6 space-y-5 shadow-none my-auto max-h-[92vh] overflow-y-auto text-slate-800">
        
        {/* HEADER MODALE */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-300/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100/80 text-sky-900 border border-sky-300/50 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-sky-900" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                Rilevazione Modulare Test Clinici LCA
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Paziente: <strong className="text-slate-800">{patient.nome} {patient.cognome}</strong> • Lato Operato:{' '}
                <strong className="text-emerald-900">{opKnee === 'DX' ? 'Destro (DX)' : 'Sinistro (SX)'}</strong> •{' '}
                <span>I campi vuoti restano <code className="text-emerald-900 font-bold">Non testato (null)</code></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 border border-slate-300/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ===================================================================== */}
          {/* STEP 1: RAGGRUPPAMENTO IN SESSIONE / REPORT CLINICO                   */}
          {/* ===================================================================== */}
          <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-300/60 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 rounded">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Sessione / Report di Riferimento (Aggregazione Multi-Giorno)
                </span>
              </div>

              {existingSessions.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-300/60">
                  <button
                    type="button"
                    onClick={() => handleSelectSessionMode('EXISTING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      sessionMode === 'EXISTING'
                        ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300/50 shadow-none'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Associa a Sessione Esistente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSessionMode('NEW')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      sessionMode === 'NEW'
                        ? 'bg-sky-100/80 text-sky-900 border-sky-300/50 shadow-none'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Nuova Sessione / Report</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sessionMode === 'EXISTING' && existingSessions.length > 0 ? (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Sessione / Report Clinico Attivo (Unisce test di giorni diversi)
                  </label>
                  <select
                    value={targetSessionId}
                    onChange={(e) => handleSelectSessionMode('EXISTING', e.target.value)}
                    className="w-full bg-emerald-100/80 border border-emerald-300/50 rounded-xl p-2.5 text-xs text-emerald-900 font-bold focus:border-emerald-600 focus:outline-none"
                  >
                    {existingSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        📋 {s.session_name || s.label} ({s.dateRange || s.date})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Nome Nuova Sessione / Report (es. &quot;Valutazione 3° Mese&quot;)
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="es. Valutazione 3° Mese / Check Pre-Run"
                    className="w-full bg-slate-50 border border-slate-300/60 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:border-slate-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Data Esecuzione Test
                </label>
                <input
                  type="date"
                  required
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300/60 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Ginocchio Operato
                </label>
                <select
                  value={opKnee}
                  onChange={(e) => setOpKnee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300/60 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:border-slate-500 focus:outline-none"
                >
                  <option value="DX">🔴 Destro (DX Operato)</option>
                  <option value="SX">🔴 Sinistro (SX Operato)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 2: SELETTORE SCHEDE TEST (SCEGLI QUALE SINGOLO TEST INSERIRE)    */}
          {/* ===================================================================== */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="p-1 bg-purple-100/80 text-purple-900 border border-purple-300/50 rounded">
                  <Sparkles className="w-4 h-4" />
                </span>
                2. Seleziona il Test Specifico da Rilevare
              </span>
              <span className="text-[11px] text-slate-600 font-semibold">
                Mostra solo i campi pertinenti al test selezionato
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEST_MODULES.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedModule === mod.id;
                const filledCount = getModuleFilledCount(mod);
                const hasData = filledCount > 0;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModule(mod.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-100/80 border-emerald-400/70 shadow-none'
                        : hasData
                        ? 'bg-slate-50 border-emerald-300/60 hover:bg-slate-100'
                        : 'bg-slate-100/80 border-slate-300/60 hover:bg-slate-200/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className={`p-1 rounded border ${
                        isSelected
                          ? 'bg-slate-50 text-emerald-900 border-emerald-300/60'
                          : 'bg-sky-100/80 text-sky-900 border-sky-300/50'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {hasData ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-300/50 text-emerald-900 text-[10px] font-bold">
                          ✓ {filledCount} dati
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/60 border border-slate-300/60 text-slate-600 text-[10px] font-semibold">
                          Vuoto
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-800 leading-snug">
                        {mod.title}
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold leading-tight mt-0.5">
                        {mod.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 3: PANNELLO CAMPI DEL SINGOLO TEST SELEZIONATO                   */}
          {/* ===================================================================== */}
          <div className="p-5 rounded-xl bg-slate-100/80 border border-slate-300/60 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-300/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-900">
                  {activeModuleDef.category} • Codice Test: {activeTestType}
                </span>
                <h4 className="text-base font-bold text-slate-800 mt-0.5">
                  {activeModuleDef.title} — <span className="text-slate-600 font-semibold text-sm">{activeModuleDef.subtitle}</span>
                </h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  const resetPatch = {};
                  activeModuleDef.fields.forEach(f => { resetPatch[f] = ''; });
                  setForm(prev => ({ ...prev, ...resetPatch }));
                }}
                className="text-[11px] font-bold text-rose-900 bg-rose-100/80 hover:bg-rose-200/70 border border-rose-300/50 px-2.5 py-1 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
              >
                Svuota campi standard (imposta a Non testato)
              </button>
            </div>

            {/* MODULO 1: ISO PUSH LEG EXTENSION */}
            {selectedModule === 'ISO_EXT' && (() => {
              const lsi = computeLSI(form.legExtSX, form.legExtDX);
              const opForce = parseVal(isOpDX ? form.legExtDX : form.legExtSX);
              const relNmKg = opForce !== null ? (opForce / 150).toFixed(2) : null;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Arto Sinistro (SX) — Newton (N)</span>
                        <span className={!isOpDX ? 'px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]'}>
                          {!isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 480)"
                        value={form.legExtSX}
                        onChange={(e) => handleChange('legExtSX', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-sm font-bold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Arto Destro (DX) — Newton (N)</span>
                        <span className={isOpDX ? 'px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]'}>
                          {isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 445)"
                        value={form.legExtDX}
                        onChange={(e) => handleChange('legExtDX', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-sm font-bold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">LSI Quadricipite Calcolato:</span>
                      <strong className={`text-sm font-mono ${lsi !== null ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {lsi !== null ? `${lsi}%` : 'Non testato (N/A)'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Forza Relativa Quad Operato:</span>
                      <strong className={`text-sm font-mono ${relNmKg !== null ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {relNmKg !== null ? `${relNmKg} Nm/kg` : 'Non testato (N/A)'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* MODULO 2: ISO PUSH LEG CURL */}
            {selectedModule === 'ISO_CURL' && (() => {
              const lsi = computeLSI(form.legCurlSX, form.legCurlDX);
              const opCurl = parseVal(isOpDX ? form.legCurlDX : form.legCurlSX);
              const opExt = parseVal(isOpDX ? form.legExtDX : form.legExtSX);
              const hqRatio = opCurl !== null && opExt !== null && opExt > 0 ? (opCurl / opExt).toFixed(2) : null;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Leg Curl Sinistro (SX) — Newton (N)</span>
                        <span className={!isOpDX ? 'px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]'}>
                          {!isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 230)"
                        value={form.legCurlSX}
                        onChange={(e) => handleChange('legCurlSX', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-sm font-bold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Leg Curl Destro (DX) — Newton (N)</span>
                        <span className={isOpDX ? 'px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]'}>
                          {isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 210)"
                        value={form.legCurlDX}
                        onChange={(e) => handleChange('legCurlDX', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-sm font-bold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">LSI Hamstring (Ischiocrurali):</span>
                      <strong className={`text-sm font-mono ${lsi !== null ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {lsi !== null ? `${lsi}%` : 'Non testato (N/A)'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">H/Q Ratio Isometrico (con Leg Ext):</span>
                      <strong className={`text-sm font-mono ${hqRatio !== null ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {hqRatio !== null ? hqRatio : 'Richiede Iso Leg Ext'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* MODULO 3: FORZA ACCESSORIA & IMTP */}
            {selectedModule === 'FORZA_DINAMICA' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Bulgarian Squat 6RM (kg)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">SX (kg)</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.bulgarianSX} onChange={(e) => handleChange('bulgarianSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">DX (kg)</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.bulgarianDX} onChange={(e) => handleChange('bulgarianDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Calf Raise (kg / N)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">SX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.calfRaiseSX} onChange={(e) => handleChange('calfRaiseSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">DX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.calfRaiseDX} onChange={(e) => handleChange('calfRaiseDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Soleo Seduto (kg / N)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">SX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.soleoSX} onChange={(e) => handleChange('soleoSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">DX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.soleoDX} onChange={(e) => handleChange('soleoDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">IMTP Peak Force (N)</span>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Picco Isometrico Bipodalico</label>
                    <input type="number" step="1" placeholder="Non testato (es. 2400)" value={form.imtpPeakForce} onChange={(e) => handleChange('imtpPeakForce', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 4: CMJ BILATERALE */}
            {selectedModule === 'CMJ_BILATERAL' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Altezza Salto (cm)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 33.5)" value={form.jumpHeight} onChange={(e) => handleChange('jumpHeight', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Contraction Time (ms)</label>
                    <input type="number" placeholder="Non testato (es. 610)" value={form.contractionTime} onChange={(e) => handleChange('contractionTime', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 text-xs font-semibold">RSImod Calcolato (m/s)</label>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">Auto</span>
                    </div>
                    <div className="w-full bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 text-emerald-800 font-mono text-xs font-bold">
                      {computeRSImod(form.jumpHeight, form.contractionTime) ?? 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Peak Power / BM (W/kg)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 48.5)" value={form.peakPower} onChange={(e) => handleChange('peakPower', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Countermovement Depth (cm)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 31.2)" value={form.cmjDepth} onChange={(e) => handleChange('cmjDepth', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Eccentric Braking RFD (N/s)</label>
                    <input type="number" step="1" placeholder="Non testato (es. 3450)" value={form.eccBrakingRfd} onChange={(e) => handleChange('eccBrakingRfd', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Concentric Impulse (N·s)</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700">
                        {computeLSI(form.concImpulseSX, form.concImpulseDX) !== null
                          ? `LSI: ${computeLSI(form.concImpulseSX, form.concImpulseDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">Sinistro (SX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.concImpulseSX} onChange={(e) => handleChange('concImpulseSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">Destro (DX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.concImpulseDX} onChange={(e) => handleChange('concImpulseDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Eccentric Braking Impulse (N·s)</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700">
                        {computeLSI(form.eccBrakingSX, form.eccBrakingDX) !== null
                          ? `LSI: ${computeLSI(form.eccBrakingSX, form.eccBrakingDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">Sinistro (SX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.eccBrakingSX} onChange={(e) => handleChange('eccBrakingSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">Destro (DX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.eccBrakingDX} onChange={(e) => handleChange('eccBrakingDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 5: CMJ MONOPODALICO (SL CMJ) */}
            {selectedModule === 'CMJ_SL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Altezza Salto SL (cm)</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {computeLSI(form.slCmjHeightSX, form.slCmjHeightDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjHeightSX, form.slCmjHeightDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Sinistra (SX)</label>
                      <input type="number" step="0.1" placeholder="es. 15.5" value={form.slCmjHeightSX} onChange={(e) => handleChange('slCmjHeightSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Destra (DX)</label>
                      <input type="number" step="0.1" placeholder="es. 14.2" value={form.slCmjHeightDX} onChange={(e) => handleChange('slCmjHeightDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Peak Power / BM SL (W/kg)</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {computeLSI(form.slCmjPeakPowerSX, form.slCmjPeakPowerDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjPeakPowerSX, form.slCmjPeakPowerDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Sinistra (SX)</label>
                      <input type="number" step="0.1" placeholder="es. 28.5" value={form.slCmjPeakPowerSX} onChange={(e) => handleChange('slCmjPeakPowerSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Destra (DX)</label>
                      <input type="number" step="0.1" placeholder="es. 26.0" value={form.slCmjPeakPowerDX} onChange={(e) => handleChange('slCmjPeakPowerDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">RSImod Monopodalico (m/s)</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {computeLSI(form.slCmjRsiSX, form.slCmjRsiDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjRsiSX, form.slCmjRsiDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Sinistro (SX)</label>
                      <input type="number" step="0.01" placeholder="es. 0.28" value={form.slCmjRsiSX} onChange={(e) => handleChange('slCmjRsiSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Destro (DX)</label>
                      <input type="number" step="0.01" placeholder="es. 0.25" value={form.slCmjRsiDX} onChange={(e) => handleChange('slCmjRsiDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Countermovement Depth SL (cm)</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {computeLSI(form.slCmjDepthSX, form.slCmjDepthDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjDepthSX, form.slCmjDepthDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Sinistro (SX)</label>
                      <input type="number" step="0.1" placeholder="es. 24.5" value={form.slCmjDepthSX} onChange={(e) => handleChange('slCmjDepthSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1">Destro (DX)</label>
                      <input type="number" step="0.1" placeholder="es. 22.0" value={form.slCmjDepthDX} onChange={(e) => handleChange('slCmjDepthDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 6: DROP JUMP BILATERALE */}
            {selectedModule === 'DJ_BILATERAL' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Altezza Caduta Box</label>
                    <select
                      value={form.djBoxHeight}
                      onChange={(e) => handleChange('djBoxHeight', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold"
                    >
                      <option value="30 cm">📦 Box 30 cm</option>
                      <option value="45 cm">📦 Box 45 cm</option>
                      <option value="60 cm">📦 Box 60 cm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Altezza Salto (cm)</label>
                    <input type="number" step="0.1" placeholder="es. 28.5" value={form.djJumpHeight} onChange={(e) => handleChange('djJumpHeight', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Contact Time GCT (&lt;250ms)</label>
                    <input type="number" placeholder="es. 215" value={form.djContactTime} onChange={(e) => handleChange('djContactTime', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">RSI (Reactive Index)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={computeRSImod(form.djJumpHeight, form.djContactTime) ? `Auto: ${computeRSImod(form.djJumpHeight, form.djContactTime)}` : 'es. 1.65'}
                      value={form.djRSI}
                      onChange={(e) => handleChange('djRSI', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-emerald-700 font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Time to Peak Force TTPF (Target 80-120 ms)</label>
                    <input type="number" placeholder="Non testato (es. 95)" value={form.djTtpfMs} onChange={(e) => handleChange('djTtpfMs', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Asimmetria Temporale Stacco L vs R (&lt;10 ms)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 4.5)" value={form.djTakeoffAsymMs} onChange={(e) => handleChange('djTakeoffAsymMs', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Landing Peak Force (N)</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700">
                        {computeLSI(form.djLandingPeakSX, form.djLandingPeakDX) !== null
                          ? `LSI: ${computeLSI(form.djLandingPeakSX, form.djLandingPeakDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">SX (N)</label>
                        <input type="number" placeholder="N/A" value={form.djLandingPeakSX} onChange={(e) => handleChange('djLandingPeakSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">DX (N)</label>
                        <input type="number" placeholder="N/A" value={form.djLandingPeakDX} onChange={(e) => handleChange('djLandingPeakDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Concentric Impulse (N·s)</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700">
                        {computeLSI(form.djConcImpulseSX, form.djConcImpulseDX) !== null
                          ? `LSI: ${computeLSI(form.djConcImpulseSX, form.djConcImpulseDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">SX (N·s)</label>
                        <input type="number" placeholder="N/A" value={form.djConcImpulseSX} onChange={(e) => handleChange('djConcImpulseSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">DX (N·s)</label>
                        <input type="number" placeholder="N/A" value={form.djConcImpulseDX} onChange={(e) => handleChange('djConcImpulseDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 7: SL DROP JUMP MONOPODALICO */}
            {selectedModule === 'DJ_SL' && (
              <div className="space-y-4">
                <div className="w-48">
                  <label className="block text-slate-600 text-xs font-semibold mb-1">Altezza Caduta Box</label>
                  <select
                    value={form.slDjBoxHeight}
                    onChange={(e) => handleChange('slDjBoxHeight', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-xs font-bold"
                  >
                    <option value="20 cm">📦 Box 20 cm</option>
                    <option value="30 cm">📦 Box 30 cm</option>
                    <option value="45 cm">📦 Box 45 cm</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">Ground Contact Time SL (ms)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">SX (ms)</label>
                        <input type="number" placeholder="N/A" value={form.slDjCtSX} onChange={(e) => handleChange('slDjCtSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">DX (ms)</label>
                        <input type="number" placeholder="N/A" value={form.slDjCtDX} onChange={(e) => handleChange('slDjCtDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">RSI SL Drop Jump (m/s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">SX (m/s)</label>
                        <input type="number" step="0.01" placeholder="N/A" value={form.slDjRsiSX} onChange={(e) => handleChange('slDjRsiSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">DX (m/s)</label>
                        <input type="number" step="0.01" placeholder="N/A" value={form.slDjRsiDX} onChange={(e) => handleChange('slDjRsiDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">Altezza Salto SL DJ (cm)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">SX (cm)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjHeightSX} onChange={(e) => handleChange('slDjHeightSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">DX (cm)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjHeightDX} onChange={(e) => handleChange('slDjHeightDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">Braking Impulse SL DJ (N·s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">SX (N·s)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjBrakingSX} onChange={(e) => handleChange('slDjBrakingSX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1">DX (N·s)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjBrakingDX} onChange={(e) => handleChange('slDjBrakingDX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 8: SCORE CLINICI & HOP TEST */}
            {selectedModule === 'CLINICAL_SCORES' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">Score IKDC Soggettivo (/100)</label>
                  <span className="block text-[10px] text-slate-500">Prontitudine clinica ginocchio</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 78.5)" value={form.ikdcScore} onChange={(e) => handleChange('ikdcScore', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs font-bold" />
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">Score ACL-RSI Psicometrico (/100)</label>
                  <span className="block text-[10px] text-slate-500">Prontitudine psicologica RTS</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 72.0)" value={form.aclrsiScore} onChange={(e) => handleChange('aclrsiScore', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs font-bold" />
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">Single Hop Test LSI (%)</label>
                  <span className="block text-[10px] text-slate-500">Simmetria salto orizzontale</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 92.5)" value={form.lsiSingleHop} onChange={(e) => handleChange('lsiSingleHop', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs font-bold" />
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">Triple Hop Test LSI (%)</label>
                  <span className="block text-[10px] text-slate-500">Simmetria triplo salto</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 94.0)" value={form.lsiTripleHop} onChange={(e) => handleChange('lsiTripleHop', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs font-bold" />
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* SEZIONE METRICHE DINAMICHE E PERSONALIZZATE PER IL TEST CORRENTE       */}
            {/* ===================================================================== */}
            <div className="pt-4 border-t border-slate-300/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-100/80 text-purple-900 border border-purple-300/50 rounded">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Metriche Dinamiche e Personalizzate ({activeModuleDef.title})
                    </h5>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      Pre-carica automaticamente le metriche già usate sul paziente e suggerisce quelle del team per <code className="text-emerald-900 font-mono">{activeTestType}</code>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomMetricRow}
                  className="px-3.5 py-2 rounded-xl bg-purple-100/80 hover:bg-purple-200/70 text-purple-900 border border-purple-300/50 font-bold text-xs flex items-center gap-1.5 shadow-none transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Aggiungi Metrica Personalizzata</span>
                </button>
              </div>

              {activeCustomMetrics.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300/80 text-xs text-slate-600 font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    Nessuna metrica personalizzata attiva per <strong>{activeModuleDef.title}</strong>. Clicca su <strong>&quot;+ Aggiungi Metrica Personalizzata&quot;</strong> per scegliere dai suggerimenti o crearne una nuova.
                  </span>
                  {globalMetricSuggestions.length > 0 && (
                    <span className="text-[11px] text-emerald-900 font-bold shrink-0">
                      {globalMetricSuggestions.length} suggerimenti disponibili
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeCustomMetrics.map((mRow, idx) => {
                    const filteredSuggestions = globalMetricSuggestions.filter(s => {
                      if (!mRow.metric_name) return true;
                      return s.metric_name.toLowerCase().includes(mRow.metric_name.toLowerCase());
                    });

                    return (
                      <div
                        key={`${activeTestType}-cm-${idx}`}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-300/60 shadow-none grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end relative"
                      >
                        {/* Nome Metrica + Menu a tendina/autocompletamento */}
                        <div className="sm:col-span-6 relative">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              Nome Metrica (Scegli o Digita Nuova)
                            </label>
                            {mRow.isPreloadedFromHistory && (
                              <span className="text-[9.5px] font-bold text-emerald-900 bg-emerald-100/80 border border-emerald-300/50 px-1.5 py-0.2 rounded">
                                Storico Paziente
                              </span>
                            )}
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={mRow.metric_name}
                              onFocus={() => setOpenSuggestionRowIdx(idx)}
                              onChange={(e) => {
                                handleUpdateCustomMetricRow(idx, 'metric_name', e.target.value);
                                setOpenSuggestionRowIdx(idx);
                              }}
                              placeholder="es. Angolo Flessione Ginocchio"
                              className="w-full bg-slate-100 border border-slate-300/60 rounded-xl py-2 pl-3 pr-8 text-xs text-slate-800 font-bold focus:border-slate-500 focus:bg-slate-50 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setOpenSuggestionRowIdx(openSuggestionRowIdx === idx ? -1 : idx)}
                              className="absolute right-2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Mostra suggerimenti per questo test"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dropdown Suggerimenti da `custom_metric_definitions` */}
                          {openSuggestionRowIdx === idx && filteredSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-slate-50 border border-slate-300/60 rounded-xl shadow-none max-h-44 overflow-y-auto divide-y divide-slate-200">
                              <div className="px-3 py-1.5 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                                <span>Suggerimenti Team ({activeTestType})</span>
                                <button
                                  type="button"
                                  onClick={() => setOpenSuggestionRowIdx(-1)}
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  Chiudi
                                </button>
                              </div>
                              {filteredSuggestions.map((sug, sIdx) => (
                                <button
                                  key={`${sug.metric_name}-${sIdx}`}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(idx, sug)}
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-slate-200/50 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <span className="font-bold text-slate-800">{sug.metric_name}</span>
                                  {sug.unit && (
                                    <span className="text-[10px] font-mono text-emerald-900 bg-emerald-100/80 border border-emerald-300/50 px-1.5 py-0.5 rounded">
                                      {sug.unit}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Unità di Misura */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Unità
                          </label>
                          <input
                            type="text"
                            value={mRow.unit}
                            onChange={(e) => handleUpdateCustomMetricRow(idx, 'unit', e.target.value)}
                            placeholder="es. gradi, N/m"
                            className="w-full bg-slate-100 border border-slate-300/60 rounded-xl p-2 text-xs text-slate-800 font-mono font-bold focus:border-slate-500 focus:bg-slate-50 focus:outline-none"
                          />
                        </div>

                        {/* Valore Misurato */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Valore Misurato
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={mRow.metric_value}
                            onChange={(e) => handleUpdateCustomMetricRow(idx, 'metric_value', e.target.value)}
                            placeholder="Non testato (null)"
                            className="w-full bg-slate-100 border border-slate-300/60 rounded-xl p-2 text-xs text-slate-800 font-mono font-bold focus:border-slate-500 focus:bg-slate-50 focus:outline-none"
                          />
                        </div>

                        {/* Pulsante Elimina / Nascondi Metrica */}
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleHideOrRemoveCustomMetric(idx, mRow)}
                            title="Elimina o nascondi questa metrica personalizzata dalla tabella del paziente"
                            className="p-2 rounded-xl bg-rose-100/80 hover:bg-rose-200/70 text-rose-900 border border-rose-300/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FEEDBACK TOAST SALVATAGGIO INTERMEDIO */}
          {savedToast && (
            <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-300/50 text-emerald-900 text-xs font-bold flex items-center justify-between">
              <span>{savedToast}</span>
              <span className="text-[11px] text-emerald-800">Puoi selezionare un altro test qui sopra o chiudere</span>
            </div>
          )}

          {/* AZIONI FINALI */}
          <div className="pt-3 border-t border-slate-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-600 font-semibold">
              Sessione attiva: <strong className="text-slate-800">{sessionName}</strong> • I campi lasciati vuoti vengono salvati come <code className="text-emerald-900 font-bold">null</code> (Non testato).
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/60 text-slate-700 text-xs font-bold border border-slate-300/60 transition-all cursor-pointer"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleSaveAndKeepOpen}
                className="px-4 py-2.5 rounded-xl bg-sky-100/80 hover:bg-sky-200/70 text-sky-900 text-xs font-bold border border-sky-300/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salva Test e Aggiungi Altro</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold text-xs flex items-center gap-2 shadow-none transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salva nel Report e Chiudi</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
