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
  Sparkles
} from 'lucide-react';
import { sortTestsByDate, getTestTimestamp, toStrictNullOrNumber } from '../utils/testUtils';

const TEST_MODULES = [
  {
    id: 'ISO_EXT',
    title: 'Iso Push Leg Ext',
    subtitle: 'Quadricipite SX/DX & LSI',
    category: 'Forza Isometrica',
    icon: Flame,
    accent: 'emerald',
    fields: ['legExtSX', 'legExtDX']
  },
  {
    id: 'ISO_CURL',
    title: 'Iso Push Leg Curl',
    subtitle: 'Ischiocrurali SX/DX & H/Q',
    category: 'Forza Isometrica',
    icon: Flame,
    accent: 'sky',
    fields: ['legCurlSX', 'legCurlDX']
  },
  {
    id: 'FORZA_DINAMICA',
    title: 'Forza Accessoria & IMTP',
    subtitle: 'Bulgarian, Calf, Soleo, IMTP',
    category: 'Forza Dinamica',
    icon: Dumbbell,
    accent: 'amber',
    fields: ['bulgarianSX', 'bulgarianDX', 'calfRaiseSX', 'calfRaiseDX', 'soleoSX', 'soleoDX', 'imtpPeakForce']
  },
  {
    id: 'CMJ_BILATERAL',
    title: 'CMJ Bilaterale',
    subtitle: 'Altezza, RSImod, Impulse L/R',
    category: 'Pliometria & Balistica',
    icon: Zap,
    accent: 'cyan',
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
    title: 'CMJ Monopodalico',
    subtitle: 'Single Leg Jump SX vs DX',
    category: 'Simmetria Balistica',
    icon: Activity,
    accent: 'emerald',
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
    title: 'RSI Drop Jump',
    subtitle: 'GCT <250ms, RSI & Force Plates',
    category: 'Reattività Bipodalica',
    icon: Box,
    accent: 'amber',
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
    title: 'SL Drop Jump',
    subtitle: 'Reattività Monopodalica SX/DX',
    category: 'Reattività Monopodalica',
    icon: Zap,
    accent: 'purple',
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
    title: 'Hop Test & Score Clinici',
    subtitle: 'IKDC, ACL-RSI, Single/Triple Hop',
    category: 'Clinica & Return to Sport',
    icon: ClipboardCheck,
    accent: 'teal',
    fields: ['ikdcScore', 'aclrsiScore', 'lsiSingleHop', 'lsiTripleHop']
  }
];

const EMPTY_FORM = {
  // 1. Iso Push Leg Ext & Leg Curl + Forza Accessoria
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

  // 2. CMJ Bilaterale
  jumpHeight: '',
  contractionTime: '',
  peakPower: '',
  cmjDepth: '',
  eccBrakingRfd: '',
  eccBrakingSX: '',
  eccBrakingDX: '',
  concImpulseSX: '',
  concImpulseDX: '',

  // 3. CMJ Monopodalico
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

  // 4. Drop Jump Bilaterale
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

  // 5. SL Drop Jump Monopodalico
  slDjBoxHeight: '30 cm',
  slDjCtSX: '',
  slDjCtDX: '',
  slDjRsiSX: '',
  slDjRsiDX: '',
  slDjHeightSX: '',
  slDjHeightDX: '',
  slDjBrakingSX: '',
  slDjBrakingDX: '',

  // 6. Score Clinici & Hop Test
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

  // Cerca se esiste una sessione recente (ultimi 14 giorni) a cui agganciare di default i nuovi test
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
  const [sessionMode, setSessionMode] = useState('NEW'); // 'EXISTING' | 'NEW'
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

  // Helper per estrarre una stringa pulita solo se il dato esiste ed è != null / 0 fittizio
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
  };

  useEffect(() => {
    setSelectedModule(initialModule || 'ISO_EXT');
    setSavedToast('');

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
      // Se c'è una sessione negli ultimi 14 giorni, propone automaticamente di agregarvi il nuovo test!
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
    }
  }, [initialData, patient, isOpen]);

  // Cambio tra Sessione Esistente e Nuova Sessione
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
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Helper rigoroso: campi vuoti o 0 non validi -> SEMPRE null
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
    return moduleObj.fields.filter(f => parseVal(form[f]) !== null).length;
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
      data_valutazione: evalDate,
      ginocchio_operato: opKnee,
      fase_riabilitativa: phase,
      valutatore: evaluator,

      // Dominio 1: Forza (SOLO valori validi o NULL, MAI 0)
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

      // Dominio 2: CMJ Bipodalico
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

      // Dominio 3: CMJ Monopodalico
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

      // Dominio 4: Drop Jump Bipodalico
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

      // Dominio 5: SL Drop Jump Monopodalico
      sl_dj_box_height: hasSlDjFields ? form.slDjBoxHeight : null,
      sl_dj_ct_sx: parseVal(form.slDjCtSX),
      sl_dj_ct_dx: parseVal(form.slDjCtDX),
      sl_dj_rsi_sx: parseVal(form.slDjRsiSX),
      sl_dj_rsi_dx: parseVal(form.slDjRsiDX),
      sl_dj_height_sx: parseVal(form.slDjHeightSX),
      sl_dj_height_dx: parseVal(form.slDjHeightDX),
      sl_dj_braking_sx: parseVal(form.slDjBrakingSX),
      sl_dj_braking_dx: parseVal(form.slDjBrakingDX),

      // Dominio 6: Score Clinici & Hop Test
      ikdc_score: parseVal(form.ikdcScore),
      aclrsi: parseVal(form.aclrsiScore),
      lsi_single_hop: parseVal(form.lsiSingleHop),
      lsi_triple_hop: parseVal(form.lsiTripleHop),

      // LSI & Asimmetrie Calcolate (null se non calcolabili)
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
      lsi_sl_cmj_ecc_impulse_calculated: computeLSI(form.slCmjEccImpulseSX, form.slCmjEccImpulseDX),
      lsi_sl_dj_ct_calculated: computeLSI(form.slDjCtSX, form.slDjCtDX),
      lsi_sl_dj_rsi_calculated: computeLSI(form.slDjRsiSX, form.slDjRsiDX),
      lsi_sl_dj_height_calculated: computeLSI(form.slDjHeightSX, form.slDjHeightDX),
      lsi_sl_dj_braking_calculated: computeLSI(form.slDjBrakingSX, form.slDjBrakingDX)
    };
  };

  const handleSaveAndKeepOpen = () => {
    const payload = buildSanitizedPayload();
    const activeModObj = TEST_MODULES.find(m => m.id === selectedModule);
    onSaveEvaluation(payload);
    setSavedToast(`✓ Modulo "${activeModObj?.title || 'Test'}" salvato nella sessione "${payload.session_name}"!`);
    setTimeout(() => setSavedToast(''), 3500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = buildSanitizedPayload();
    onSaveEvaluation(payload);
    onClose();
  };

  const activeModuleDef = TEST_MODULES.find(m => m.id === selectedModule) || TEST_MODULES[0];
  const isOpDX = opKnee === 'DX';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        
        {/* HEADER MODALE */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                Rilevazione Modulare Test Clinici LCA
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paziente: <strong className="text-slate-100">{patient.nome} {patient.cognome}</strong> • Lato Operato:{' '}
                <strong className="text-emerald-400">{opKnee === 'DX' ? 'Destro (DX)' : 'Sinistro (SX)'}</strong> •{' '}
                <span className="text-slate-400">I test non compilati restano <code className="text-amber-300">Non testato (null)</code></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ===================================================================== */}
          {/* STEP 1: RAGGRUPPAMENTO IN SESSIONE / REPORT CLINICO                   */}
          {/* ===================================================================== */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  1. Sessione / Report di Riferimento (Aggregazione Multi-Giorno)
                </span>
              </div>

              {existingSessions.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSelectSessionMode('EXISTING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      sessionMode === 'EXISTING'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Associa a Sessione Esistente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSessionMode('NEW')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      sessionMode === 'NEW'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Nuova Sessione / Report</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Selezione o Nome della Sessione */}
              {sessionMode === 'EXISTING' && existingSessions.length > 0 ? (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Sessione / Report Clinico Attivo (Unisce test di giorni diversi)
                  </label>
                  <select
                    value={targetSessionId}
                    onChange={(e) => handleSelectSessionMode('EXISTING', e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl p-2.5 text-xs text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none"
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
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nome Nuova Sessione / Report (es. &quot;Valutazione 3° Mese&quot;)
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="es. Valutazione 3° Mese / Check Pre-Run"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-sky-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Data Esecuzione Test
                </label>
                <input
                  type="date"
                  required
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono font-bold focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Ginocchio Operato
                </label>
                <select
                  value={opKnee}
                  onChange={(e) => setOpKnee(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none"
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                2. Seleziona il Test Specifico da Rilevare
              </span>
              <span className="text-[11px] text-slate-400">
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
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-400 shadow-lg ring-1 ring-emerald-400/40'
                        : hasData
                        ? 'bg-slate-900/90 border-emerald-500/30 hover:border-slate-600'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className={`p-1.5 rounded-lg border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-700/80 text-slate-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {hasData ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                          ✓ {filledCount} dati
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-semibold">
                          Vuoto
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-100 leading-snug">
                        {mod.title}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
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
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-700/80 space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  {activeModuleDef.category}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {activeModuleDef.title} — <span className="text-slate-400 font-normal text-sm">{activeModuleDef.subtitle}</span>
                </h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  const resetPatch = {};
                  activeModuleDef.fields.forEach(f => { resetPatch[f] = ''; });
                  setForm(prev => ({ ...prev, ...resetPatch }));
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition-colors self-start sm:self-auto cursor-pointer"
              >
                Svuota campi di questo test (imposta a Non testato)
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
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Arto Sinistro (SX) — Newton (N)</span>
                        <span className={!isOpDX ? 'px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]'}>
                          {!isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 480)"
                        value={form.legExtSX}
                        onChange={(e) => handleChange('legExtSX', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Arto Destro (DX) — Newton (N)</span>
                        <span className={isOpDX ? 'px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]'}>
                          {isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 445)"
                        value={form.legExtDX}
                        onChange={(e) => handleChange('legExtDX', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">LSI Quadricipite Calcolato:</span>
                      <strong className={`text-sm font-mono ${lsi !== null ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {lsi !== null ? `${lsi}%` : 'Non testato (N/A)'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Forza Relativa Quad Operato:</span>
                      <strong className={`text-sm font-mono ${relNmKg !== null ? 'text-sky-400' : 'text-slate-500'}`}>
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
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Leg Curl Sinistro (SX) — Newton (N)</span>
                        <span className={!isOpDX ? 'px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]'}>
                          {!isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 230)"
                        value={form.legCurlSX}
                        onChange={(e) => handleChange('legCurlSX', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Leg Curl Destro (DX) — Newton (N)</span>
                        <span className={isOpDX ? 'px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]' : 'px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]'}>
                          {isOpDX ? '🔴 ARTO OPERATO' : '🟢 ARTO SANO'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Non testato (es. 210)"
                        value={form.legCurlDX}
                        onChange={(e) => handleChange('legCurlDX', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">LSI Hamstring (Ischiocrurali):</span>
                      <strong className={`text-sm font-mono ${lsi !== null ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {lsi !== null ? `${lsi}%` : 'Non testato (N/A)'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">H/Q Ratio Isometrico (con Leg Ext):</span>
                      <strong className={`text-sm font-mono ${hqRatio !== null ? 'text-sky-400' : 'text-slate-500'}`}>
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
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-100 block">Bulgarian Squat 6RM (kg)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">SX (kg)</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.bulgarianSX} onChange={(e) => handleChange('bulgarianSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">DX (kg)</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.bulgarianDX} onChange={(e) => handleChange('bulgarianDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-100 block">Calf Raise (kg / N)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">SX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.calfRaiseSX} onChange={(e) => handleChange('calfRaiseSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">DX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.calfRaiseDX} onChange={(e) => handleChange('calfRaiseDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-100 block">Soleo Seduto (kg / N)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">SX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.soleoSX} onChange={(e) => handleChange('soleoSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">DX</label>
                      <input type="number" step="0.5" placeholder="N/A" value={form.soleoDX} onChange={(e) => handleChange('soleoDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-100 block">IMTP Peak Force (N)</span>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Picco Isometrico Bipodalico</label>
                    <input type="number" step="1" placeholder="Non testato (es. 2400)" value={form.imtpPeakForce} onChange={(e) => handleChange('imtpPeakForce', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs font-bold" />
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 4: CMJ BILATERALE */}
            {selectedModule === 'CMJ_BILATERAL' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Altezza Salto (cm)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 33.5)" value={form.jumpHeight} onChange={(e) => handleChange('jumpHeight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-300 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Contraction Time (ms)</label>
                    <input type="number" placeholder="Non testato (es. 610)" value={form.contractionTime} onChange={(e) => handleChange('contractionTime', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-300 text-xs font-semibold">RSImod Calcolato (m/s)</label>
                      <span className="text-[10px] text-sky-400 font-mono">Auto</span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono text-xs font-bold">
                      {computeRSImod(form.jumpHeight, form.contractionTime) ?? 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Peak Power / BM (W/kg)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 48.5)" value={form.peakPower} onChange={(e) => handleChange('peakPower', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Countermovement Depth (cm)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 31.2)" value={form.cmjDepth} onChange={(e) => handleChange('cmjDepth', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sky-300 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Eccentric Braking RFD (N/s)</label>
                    <input type="number" step="1" placeholder="Non testato (es. 3450)" value={form.eccBrakingRfd} onChange={(e) => handleChange('eccBrakingRfd', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-purple-300 font-mono text-xs font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">Concentric Impulse (N·s)</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {computeLSI(form.concImpulseSX, form.concImpulseDX) !== null
                          ? `LSI: ${computeLSI(form.concImpulseSX, form.concImpulseDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Sinistro (SX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.concImpulseSX} onChange={(e) => handleChange('concImpulseSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Destro (DX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.concImpulseDX} onChange={(e) => handleChange('concImpulseDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">Eccentric Braking Impulse (N·s)</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {computeLSI(form.eccBrakingSX, form.eccBrakingDX) !== null
                          ? `LSI: ${computeLSI(form.eccBrakingSX, form.eccBrakingDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Sinistro (SX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.eccBrakingSX} onChange={(e) => handleChange('eccBrakingSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Destro (DX)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.eccBrakingDX} onChange={(e) => handleChange('eccBrakingDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 5: CMJ MONOPODALICO (SL CMJ) */}
            {selectedModule === 'CMJ_SL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">Altezza Salto SL (cm)</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {computeLSI(form.slCmjHeightSX, form.slCmjHeightDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjHeightSX, form.slCmjHeightDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Sinistra (SX)</label>
                      <input type="number" step="0.1" placeholder="es. 15.5" value={form.slCmjHeightSX} onChange={(e) => handleChange('slCmjHeightSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Destra (DX)</label>
                      <input type="number" step="0.1" placeholder="es. 14.2" value={form.slCmjHeightDX} onChange={(e) => handleChange('slCmjHeightDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">Peak Power / BM SL (W/kg)</span>
                    <span className="text-[10px] font-mono text-sky-400">
                      {computeLSI(form.slCmjPeakPowerSX, form.slCmjPeakPowerDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjPeakPowerSX, form.slCmjPeakPowerDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Sinistra (SX)</label>
                      <input type="number" step="0.1" placeholder="es. 28.5" value={form.slCmjPeakPowerSX} onChange={(e) => handleChange('slCmjPeakPowerSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Destra (DX)</label>
                      <input type="number" step="0.1" placeholder="es. 26.0" value={form.slCmjPeakPowerDX} onChange={(e) => handleChange('slCmjPeakPowerDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">RSImod Monopodalico (m/s)</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {computeLSI(form.slCmjRsiSX, form.slCmjRsiDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjRsiSX, form.slCmjRsiDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Sinistro (SX)</label>
                      <input type="number" step="0.01" placeholder="es. 0.28" value={form.slCmjRsiSX} onChange={(e) => handleChange('slCmjRsiSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Destro (DX)</label>
                      <input type="number" step="0.01" placeholder="es. 0.25" value={form.slCmjRsiDX} onChange={(e) => handleChange('slCmjRsiDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">Countermovement Depth SL (cm)</span>
                    <span className="text-[10px] font-mono text-sky-400">
                      {computeLSI(form.slCmjDepthSX, form.slCmjDepthDX) !== null
                        ? `LSI: ${computeLSI(form.slCmjDepthSX, form.slCmjDepthDX)}%`
                        : 'LSI: N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Sinistro (SX)</label>
                      <input type="number" step="0.1" placeholder="es. 24.5" value={form.slCmjDepthSX} onChange={(e) => handleChange('slCmjDepthSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Destro (DX)</label>
                      <input type="number" step="0.1" placeholder="es. 22.0" value={form.slCmjDepthDX} onChange={(e) => handleChange('slCmjDepthDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
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
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Altezza Caduta Box</label>
                    <select
                      value={form.djBoxHeight}
                      onChange={(e) => handleChange('djBoxHeight', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono text-xs font-bold"
                    >
                      <option value="30 cm">📦 Box 30 cm</option>
                      <option value="45 cm">📦 Box 45 cm</option>
                      <option value="60 cm">📦 Box 60 cm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Altezza Salto (cm)</label>
                    <input type="number" step="0.1" placeholder="es. 28.5" value={form.djJumpHeight} onChange={(e) => handleChange('djJumpHeight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Contact Time GCT (&lt;250ms)</label>
                    <input type="number" placeholder="es. 215" value={form.djContactTime} onChange={(e) => handleChange('djContactTime', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">RSI (Reactive Index)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={computeRSImod(form.djJumpHeight, form.djContactTime) ? `Auto: ${computeRSImod(form.djJumpHeight, form.djContactTime)}` : 'es. 1.65'}
                      value={form.djRSI}
                      onChange={(e) => handleChange('djRSI', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-300 font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Time to Peak Force TTPF (Target 80-120 ms)</label>
                    <input type="number" placeholder="Non testato (es. 95)" value={form.djTtpfMs} onChange={(e) => handleChange('djTtpfMs', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sky-300 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Asimmetria Temporale Stacco L vs R (&lt;10 ms)</label>
                    <input type="number" step="0.1" placeholder="Non testato (es. 4.5)" value={form.djTakeoffAsymMs} onChange={(e) => handleChange('djTakeoffAsymMs', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-300 font-mono text-xs font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">Landing Peak Force (N)</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {computeLSI(form.djLandingPeakSX, form.djLandingPeakDX) !== null
                          ? `LSI: ${computeLSI(form.djLandingPeakSX, form.djLandingPeakDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">SX (N)</label>
                        <input type="number" placeholder="N/A" value={form.djLandingPeakSX} onChange={(e) => handleChange('djLandingPeakSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">DX (N)</label>
                        <input type="number" placeholder="N/A" value={form.djLandingPeakDX} onChange={(e) => handleChange('djLandingPeakDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">Concentric Impulse (N·s)</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {computeLSI(form.djConcImpulseSX, form.djConcImpulseDX) !== null
                          ? `LSI: ${computeLSI(form.djConcImpulseSX, form.djConcImpulseDX)}%`
                          : 'LSI: N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">SX (N·s)</label>
                        <input type="number" placeholder="N/A" value={form.djConcImpulseSX} onChange={(e) => handleChange('djConcImpulseSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">DX (N·s)</label>
                        <input type="number" placeholder="N/A" value={form.djConcImpulseDX} onChange={(e) => handleChange('djConcImpulseDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
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
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Altezza Caduta Box</label>
                  <select
                    value={form.slDjBoxHeight}
                    onChange={(e) => handleChange('slDjBoxHeight', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-amber-300 font-mono text-xs font-bold"
                  >
                    <option value="20 cm">📦 Box 20 cm</option>
                    <option value="30 cm">📦 Box 30 cm</option>
                    <option value="45 cm">📦 Box 45 cm</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-100 block">Ground Contact Time SL (ms)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">SX (ms)</label>
                        <input type="number" placeholder="N/A" value={form.slDjCtSX} onChange={(e) => handleChange('slDjCtSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">DX (ms)</label>
                        <input type="number" placeholder="N/A" value={form.slDjCtDX} onChange={(e) => handleChange('slDjCtDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-100 block">RSI SL Drop Jump (m/s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">SX (m/s)</label>
                        <input type="number" step="0.01" placeholder="N/A" value={form.slDjRsiSX} onChange={(e) => handleChange('slDjRsiSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">DX (m/s)</label>
                        <input type="number" step="0.01" placeholder="N/A" value={form.slDjRsiDX} onChange={(e) => handleChange('slDjRsiDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-100 block">Altezza Salto SL DJ (cm)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">SX (cm)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjHeightSX} onChange={(e) => handleChange('slDjHeightSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">DX (cm)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjHeightDX} onChange={(e) => handleChange('slDjHeightDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-100 block">Braking Impulse SL DJ (N·s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">SX (N·s)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjBrakingSX} onChange={(e) => handleChange('slDjBrakingSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">DX (N·s)</label>
                        <input type="number" step="0.1" placeholder="N/A" value={form.slDjBrakingDX} onChange={(e) => handleChange('slDjBrakingDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULO 8: SCORE CLINICI & HOP TEST */}
            {selectedModule === 'CLINICAL_SCORES' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-100">Score IKDC Soggettivo (/100)</label>
                  <span className="block text-[10px] text-slate-400">Prontitudine clinica ginocchio</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 78.5)" value={form.ikdcScore} onChange={(e) => handleChange('ikdcScore', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-emerald-300 font-mono text-xs font-bold" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-100">Score ACL-RSI Psicometrico (/100)</label>
                  <span className="block text-[10px] text-slate-400">Prontitudine psicologica RTS</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 72.0)" value={form.aclrsiScore} onChange={(e) => handleChange('aclrsiScore', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sky-300 font-mono text-xs font-bold" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-100">Single Hop Test LSI (%)</label>
                  <span className="block text-[10px] text-slate-400">Simmetria salto orizzontale</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 92.5)" value={form.lsiSingleHop} onChange={(e) => handleChange('lsiSingleHop', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs font-bold" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-100">Triple Hop Test LSI (%)</label>
                  <span className="block text-[10px] text-slate-400">Simmetria triplo salto</span>
                  <input type="number" step="0.1" placeholder="Non testato (es. 94.0)" value={form.lsiTripleHop} onChange={(e) => handleChange('lsiTripleHop', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs font-bold" />
                </div>
              </div>
            )}
          </div>

          {/* FEEDBACK TOAST SALVATAGGIO INTERMEDIO */}
          {savedToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span>{savedToast}</span>
              <span className="text-[11px] text-emerald-200">Puoi selezionare un altro test qui sopra o chiudere</span>
            </div>
          )}

          {/* AZIONI FINALI */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Sessione attiva: <strong className="text-slate-200">{sessionName}</strong> • I campi lasciati vuoti vengono salvati come <code className="text-emerald-400">null</code> (Non testato).
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleSaveAndKeepOpen}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salva Test e Aggiungi Altro</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg border border-emerald-400/40 transition-all cursor-pointer"
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
