import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Activity, 
  Plus, 
  Calculator, 
  Dumbbell, 
  TrendingUp, 
  AlertCircle,
  Package,
  Layers,
  Box
} from 'lucide-react';

export default function ModalNuovaValutazione({ 
  isOpen, 
  onClose, 
  patient, 
  onSaveEvaluation,
  initialData = null 
}) {
  if (!isOpen || !patient) return null;

  // Ginocchio Operato dal paziente (default DX o dal paziente)
  const [opKnee, setOpKnee] = useState(
    patient.lato_lesione === 'Sx' || patient.lato_lesione === 'SX' ? 'SX' : 'DX'
  );

  // Header State
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [phase, setPhase] = useState(patient.fase_riabilitativa || 'Fase 3 (3-6 mesi)');
  const [evaluator, setEvaluator] = useState('N Rehab Team');

  // Form Fields State per TUTTI i 5 Domini Clinici Completi
  const [form, setForm] = useState({
    // 1. Dominio della Forza
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

    // 2. CMJ Bipodalico (Modello Essenziale)
    jumpHeight: '',
    contractionTime: '',
    peakPower: '',
    eccBrakingSX: '',
    eccBrakingDX: '',
    concImpulseSX: '',
    concImpulseDX: '',

    // 3. Single Leg CMJ (SL CMJ Monopodalico)
    slCmjHeightSX: '',
    slCmjHeightDX: '',
    slCmjCtSX: '',
    slCmjCtDX: '',
    slCmjPeakPowerSX: '',
    slCmjPeakPowerDX: '',
    slCmjRsiSX: '',
    slCmjRsiDX: '',
    slCmjEccImpulseSX: '',
    slCmjEccImpulseDX: '',

    // 4. Drop Jump Bipodalico (DJ - RTP Specialist & Dual Load Cells)
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

    // 5. Single Leg Drop Jump (SL DJ Monopodalico)
    slDjBoxHeight: '30 cm',
    slDjCtSX: '',
    slDjCtDX: '',
    slDjRsiSX: '',
    slDjRsiDX: '',
    slDjHeightSX: '',
    slDjHeightDX: '',
    slDjBrakingSX: '',
    slDjBrakingDX: ''
  });

  // Load initialData if provided
  useEffect(() => {
    if (initialData) {
      setEvalDate(initialData.data_valutazione || initialData.date || new Date().toISOString().split('T')[0]);
      setPhase(initialData.fase_riabilitativa || patient.fase_riabilitativa || 'Fase 3 (3-6 mesi)');
      setEvaluator(initialData.valutatore || 'N Rehab Team');
      if (initialData.ginocchio_operato) {
        setOpKnee(initialData.ginocchio_operato);
      }
      
      setForm({
        legExtSX: initialData.legExtSX ?? (initialData.iso_leg_ext_sx !== undefined && initialData.iso_leg_ext_sx !== null ? String(initialData.iso_leg_ext_sx) : ''),
        legExtDX: initialData.legExtDX ?? (initialData.iso_leg_ext_dx !== undefined && initialData.iso_leg_ext_dx !== null ? String(initialData.iso_leg_ext_dx) : ''),
        legCurlSX: initialData.legCurlSX ?? (initialData.iso_leg_curl_sx !== undefined && initialData.iso_leg_curl_sx !== null ? String(initialData.iso_leg_curl_sx) : ''),
        legCurlDX: initialData.legCurlDX ?? (initialData.iso_leg_curl_dx !== undefined && initialData.iso_leg_curl_dx !== null ? String(initialData.iso_leg_curl_dx) : ''),
        calfRaiseSX: initialData.calfRaiseSX ?? (initialData.calf_raise_sx !== undefined && initialData.calf_raise_sx !== null ? String(initialData.calf_raise_sx) : ''),
        calfRaiseDX: initialData.calfRaiseDX ?? (initialData.calf_raise_dx !== undefined && initialData.calf_raise_dx !== null ? String(initialData.calf_raise_dx) : ''),
        soleoSX: initialData.soleoSX ?? (initialData.soleo_sx !== undefined && initialData.soleo_sx !== null ? String(initialData.soleo_sx) : ''),
        soleoDX: initialData.soleoDX ?? (initialData.soleo_dx !== undefined && initialData.soleo_dx !== null ? String(initialData.soleo_dx) : ''),
        bulgarianSX: initialData.bulgarianSX ?? (initialData.bulgarian_sx !== undefined && initialData.bulgarian_sx !== null ? String(initialData.bulgarian_sx) : ''),
        bulgarianDX: initialData.bulgarianDX ?? (initialData.bulgarian_dx !== undefined && initialData.bulgarian_dx !== null ? String(initialData.bulgarian_dx) : ''),
        imtpPeakForce: initialData.imtpPeakForce ?? (initialData.imtp_peak_force !== undefined && initialData.imtp_peak_force !== null ? String(initialData.imtp_peak_force) : ''),

        jumpHeight: initialData.jumpHeight ?? (initialData.jump_height_cm !== undefined && initialData.jump_height_cm !== null ? String(initialData.jump_height_cm) : ''),
        contractionTime: initialData.contractionTime ?? (initialData.contraction_time_ms !== undefined && initialData.contraction_time_ms !== null ? String(initialData.contraction_time_ms) : ''),
        peakPower: initialData.peakPower ?? (initialData.peak_power_w !== undefined && initialData.peak_power_w !== null ? String(initialData.peak_power_w) : ''),
        eccBrakingSX: initialData.eccBrakingSX ?? (initialData.ecc_braking_sx !== undefined && initialData.ecc_braking_sx !== null ? String(initialData.ecc_braking_sx) : ''),
        eccBrakingDX: initialData.eccBrakingDX ?? (initialData.ecc_braking_dx !== undefined && initialData.ecc_braking_dx !== null ? String(initialData.ecc_braking_dx) : ''),
        concImpulseSX: initialData.concImpulseSX ?? (initialData.conc_impulse_sx !== undefined && initialData.conc_impulse_sx !== null ? String(initialData.conc_impulse_sx) : ''),
        concImpulseDX: initialData.concImpulseDX ?? (initialData.conc_impulse_dx !== undefined && initialData.conc_impulse_dx !== null ? String(initialData.conc_impulse_dx) : ''),

        slCmjHeightSX: initialData.slCmjHeightSX ?? (initialData.sl_cmj_height_sx !== undefined && initialData.sl_cmj_height_sx !== null ? String(initialData.sl_cmj_height_sx) : ''),
        slCmjHeightDX: initialData.slCmjHeightDX ?? (initialData.sl_cmj_height_dx !== undefined && initialData.sl_cmj_height_dx !== null ? String(initialData.sl_cmj_height_dx) : ''),
        slCmjCtSX: initialData.slCmjCtSX ?? (initialData.sl_cmj_ct_sx !== undefined && initialData.sl_cmj_ct_sx !== null ? String(initialData.sl_cmj_ct_sx) : ''),
        slCmjCtDX: initialData.slCmjCtDX ?? (initialData.sl_cmj_ct_dx !== undefined && initialData.sl_cmj_ct_dx !== null ? String(initialData.sl_cmj_ct_dx) : ''),
        slCmjPeakPowerSX: initialData.slCmjPeakPowerSX ?? (initialData.sl_cmj_peak_power_sx !== undefined && initialData.sl_cmj_peak_power_sx !== null ? String(initialData.sl_cmj_peak_power_sx) : ''),
        slCmjPeakPowerDX: initialData.slCmjPeakPowerDX ?? (initialData.sl_cmj_peak_power_dx !== undefined && initialData.sl_cmj_peak_power_dx !== null ? String(initialData.sl_cmj_peak_power_dx) : ''),
        slCmjRsiSX: initialData.slCmjRsiSX ?? (initialData.sl_cmj_rsi_sx !== undefined && initialData.sl_cmj_rsi_sx !== null ? String(initialData.sl_cmj_rsi_sx) : ''),
        slCmjRsiDX: initialData.slCmjRsiDX ?? (initialData.sl_cmj_rsi_dx !== undefined && initialData.sl_cmj_rsi_dx !== null ? String(initialData.sl_cmj_rsi_dx) : ''),
        slCmjEccImpulseSX: initialData.slCmjEccImpulseSX ?? (initialData.sl_cmj_ecc_impulse_sx !== undefined && initialData.sl_cmj_ecc_impulse_sx !== null ? String(initialData.sl_cmj_ecc_impulse_sx) : ''),
        slCmjEccImpulseDX: initialData.slCmjEccImpulseDX ?? (initialData.sl_cmj_ecc_impulse_dx !== undefined && initialData.sl_cmj_ecc_impulse_dx !== null ? String(initialData.sl_cmj_ecc_impulse_dx) : ''),

        djBoxHeight: initialData.djBoxHeight || initialData.dj_box_height || '30 cm',
        djJumpHeight: initialData.djJumpHeight ?? (initialData.dj_jump_height !== undefined && initialData.dj_jump_height !== null ? String(initialData.dj_jump_height) : ''),
        djContactTime: initialData.djContactTime ?? (initialData.dj_contact_time !== undefined && initialData.dj_contact_time !== null ? String(initialData.dj_contact_time) : ''),
        djRSI: initialData.djRSI ?? (initialData.dj_rsi !== undefined && initialData.dj_rsi !== null ? String(initialData.dj_rsi) : ''),
        djTtpfMs: initialData.djTtpfMs ?? (initialData.dj_ttpf_ms !== undefined && initialData.dj_ttpf_ms !== null ? String(initialData.dj_ttpf_ms) : ''),
        djTakeoffAsymMs: initialData.djTakeoffAsymMs ?? (initialData.dj_takeoff_asym_ms !== undefined && initialData.dj_takeoff_asym_ms !== null ? String(initialData.dj_takeoff_asym_ms) : ''),
        djLandingPeakSX: initialData.djLandingPeakSX ?? (initialData.dj_landing_peak_sx !== undefined && initialData.dj_landing_peak_sx !== null ? String(initialData.dj_landing_peak_sx) : ''),
        djLandingPeakDX: initialData.djLandingPeakDX ?? (initialData.dj_landing_peak_dx !== undefined && initialData.dj_landing_peak_dx !== null ? String(initialData.dj_landing_peak_dx) : ''),
        djConcImpulseSX: initialData.djConcImpulseSX ?? (initialData.dj_conc_impulse_sx !== undefined && initialData.dj_conc_impulse_sx !== null ? String(initialData.dj_conc_impulse_sx) : ''),
        djConcImpulseDX: initialData.djConcImpulseDX ?? (initialData.dj_conc_impulse_dx !== undefined && initialData.dj_conc_impulse_dx !== null ? String(initialData.dj_conc_impulse_dx) : ''),
        djBrakingForce: initialData.djBrakingForce ?? (initialData.dj_braking_force !== undefined && initialData.dj_braking_force !== null ? String(initialData.dj_braking_force) : ''),
        djBrakingImpulse: initialData.djBrakingImpulse ?? (initialData.dj_braking_impulse !== undefined && initialData.dj_braking_impulse !== null ? String(initialData.dj_braking_impulse) : ''),

        slDjBoxHeight: initialData.slDjBoxHeight || initialData.sl_dj_box_height || '30 cm',
        slDjCtSX: initialData.slDjCtSX ?? (initialData.sl_dj_ct_sx !== undefined && initialData.sl_dj_ct_sx !== null ? String(initialData.sl_dj_ct_sx) : ''),
        slDjCtDX: initialData.slDjCtDX ?? (initialData.sl_dj_ct_dx !== undefined && initialData.sl_dj_ct_dx !== null ? String(initialData.sl_dj_ct_dx) : ''),
        slDjRsiSX: initialData.slDjRsiSX ?? (initialData.sl_dj_rsi_sx !== undefined && initialData.sl_dj_rsi_sx !== null ? String(initialData.sl_dj_rsi_sx) : ''),
        slDjRsiDX: initialData.slDjRsiDX ?? (initialData.sl_dj_rsi_dx !== undefined && initialData.sl_dj_rsi_dx !== null ? String(initialData.sl_dj_rsi_dx) : ''),
        slDjHeightSX: initialData.slDjHeightSX ?? (initialData.sl_dj_height_sx !== undefined && initialData.sl_dj_height_sx !== null ? String(initialData.sl_dj_height_sx) : ''),
        slDjHeightDX: initialData.slDjHeightDX ?? (initialData.sl_dj_height_dx !== undefined && initialData.sl_dj_height_dx !== null ? String(initialData.sl_dj_height_dx) : ''),
        slDjBrakingSX: initialData.slDjBrakingSX ?? (initialData.sl_dj_braking_sx !== undefined && initialData.sl_dj_braking_sx !== null ? String(initialData.sl_dj_braking_sx) : ''),
        slDjBrakingDX: initialData.slDjBrakingDX ?? (initialData.sl_dj_braking_dx !== undefined && initialData.sl_dj_braking_dx !== null ? String(initialData.sl_dj_braking_dx) : '')
      });
    } else {
      setEvalDate(new Date().toISOString().split('T')[0]);
      setPhase(patient?.fase_riabilitativa || 'Fase 3 (3-6 mesi)');
      setEvaluator('N Rehab Team');
      setForm({
        legExtSX: '', legExtDX: '', legCurlSX: '', legCurlDX: '', calfRaiseSX: '', calfRaiseDX: '',
        soleoSX: '', soleoDX: '', bulgarianSX: '', bulgarianDX: '', imtpPeakForce: '',
        jumpHeight: '', contractionTime: '', peakPower: '', eccBrakingSX: '', eccBrakingDX: '', concImpulseSX: '', concImpulseDX: '',
        slCmjHeightSX: '', slCmjHeightDX: '', slCmjCtSX: '', slCmjCtDX: '', slCmjPeakPowerSX: '', slCmjPeakPowerDX: '', slCmjRsiSX: '', slCmjRsiDX: '', slCmjEccImpulseSX: '', slCmjEccImpulseDX: '',
        djBoxHeight: '30 cm', djJumpHeight: '', djContactTime: '', djRSI: '', djTtpfMs: '', djTakeoffAsymMs: '', djLandingPeakSX: '', djLandingPeakDX: '', djConcImpulseSX: '', djConcImpulseDX: '', djBrakingForce: '', djBrakingImpulse: '',
        slDjBoxHeight: '30 cm', slDjCtSX: '', slDjCtDX: '', slDjRsiSX: '', slDjRsiDX: '', slDjHeightSX: '', slDjHeightDX: '', slDjBrakingSX: '', slDjBrakingDX: ''
      });
    }
  }, [initialData, patient, isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Helper scomposizione NULL
  const parseVal = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Calcolo LSI % per coppia SX/DX (Operato vs Sano)
  const computeLSI = (valSX, valDX) => {
    const numSX = parseVal(valSX);
    const numDX = parseVal(valDX);
    if (numSX === null || numDX === null) return null;

    let opVal = opKnee === 'DX' ? numDX : numSX;
    let sanoVal = opKnee === 'DX' ? numSX : numDX;

    if (sanoVal === 0) return null;
    return ((opVal / sanoVal) * 100).toFixed(1);
  };

  // Calcolo % Asimmetria: ((Sano - Operato) / Sano) * 100
  const computeLimbAsym = (valSX, valDX) => {
    const numSX = parseVal(valSX);
    const numDX = parseVal(valDX);
    if (numSX === null || numDX === null) return null;

    let opVal = opKnee === 'DX' ? numDX : numSX;
    let sanoVal = opKnee === 'DX' ? numSX : numDX;

    if (sanoVal === 0) return null;
    return (((sanoVal - opVal) / sanoVal) * 100).toFixed(1);
  };

  // Calcolo automatico RSImod = Jump Height (m) / (Contraction Time (ms) / 1000)
  const computeRSImod = (jumpHeightCm, contractionTimeMs) => {
    const jh = parseVal(jumpHeightCm);
    const ct = parseVal(contractionTimeMs);
    if (jh === null || ct === null || ct === 0) return null;
    return ((jh / 100) / (ct / 1000)).toFixed(2);
  };

  // Conteggio Dati Raccolti per Sezione
  const getCollectedCount = (fields) => {
    return fields.filter(f => form[f] !== '' && form[f] !== null && form[f] !== undefined).length;
  };

  const countForza = getCollectedCount(['legExtSX', 'legExtDX', 'legCurlSX', 'legCurlDX', 'calfRaiseSX', 'calfRaiseDX', 'soleoSX', 'soleoDX', 'bulgarianSX', 'bulgarianDX', 'imtpPeakForce']);
  const countCMJ = getCollectedCount(['jumpHeight', 'contractionTime', 'peakPower', 'eccBrakingSX', 'eccBrakingDX', 'concImpulseSX', 'concImpulseDX']);
  const countSlCmj = getCollectedCount(['slCmjHeightSX', 'slCmjHeightDX', 'slCmjCtSX', 'slCmjCtDX', 'slCmjPeakPowerSX', 'slCmjPeakPowerDX', 'slCmjRsiSX', 'slCmjRsiDX', 'slCmjEccImpulseSX', 'slCmjEccImpulseDX']);
  const countDJ = getCollectedCount(['djContactTime', 'djRSI', 'djJumpHeight', 'djTtpfMs', 'djTakeoffAsymMs', 'djLandingPeakSX', 'djLandingPeakDX', 'djConcImpulseSX', 'djConcImpulseDX', 'djBrakingForce', 'djBrakingImpulse']);
  const countSlDj = getCollectedCount(['slDjCtSX', 'slDjCtDX', 'slDjRsiSX', 'slDjRsiDX', 'slDjHeightSX', 'slDjHeightDX', 'slDjBrakingSX', 'slDjBrakingDX']);

  const handleSubmit = (e) => {
    e.preventDefault();

    const sanitizedData = {
      patient_id: patient?.id,
      patientId: patient?.id,
      id: initialData?.id,
      num: initialData?.num,
      label: initialData?.label,
      data_valutazione: evalDate,
      ginocchio_operato: opKnee,
      fase_riabilitativa: phase,
      valutatore: evaluator,

      // Dominio 1: Forza
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
      sl_cmj_rsi_sx: parseVal(form.slCmjRsiSX) || computeRSImod(form.slCmjHeightSX, form.slCmjCtSX),
      sl_cmj_rsi_dx: parseVal(form.slCmjRsiDX) || computeRSImod(form.slCmjHeightDX, form.slCmjCtDX),
      sl_cmj_ecc_impulse_sx: parseVal(form.slCmjEccImpulseSX),
      sl_cmj_ecc_impulse_dx: parseVal(form.slCmjEccImpulseDX),

      // Dominio 4: Drop Jump Bipodalico (RTP Specialist & Dual Load Cells)
      dj_box_height: form.djBoxHeight,
      dj_jump_height: parseVal(form.djJumpHeight),
      dj_contact_time: parseVal(form.djContactTime),
      dj_rsi: parseVal(form.djRSI) || computeRSImod(form.djJumpHeight, form.djContactTime),
      dj_ttpf_ms: parseVal(form.djTtpfMs),
      dj_takeoff_asym_ms: parseVal(form.djTakeoffAsymMs),
      dj_landing_peak_sx: parseVal(form.djLandingPeakSX),
      dj_landing_peak_dx: parseVal(form.djLandingPeakDX),
      dj_conc_impulse_sx: parseVal(form.djConcImpulseSX),
      dj_conc_impulse_dx: parseVal(form.djConcImpulseDX),
      dj_braking_force: parseVal(form.djBrakingForce),
      dj_braking_impulse: parseVal(form.djBrakingImpulse),

      // Dominio 5: SL Drop Jump Monopodalico
      sl_dj_box_height: form.slDjBoxHeight,
      sl_dj_ct_sx: parseVal(form.slDjCtSX),
      sl_dj_ct_dx: parseVal(form.slDjCtDX),
      sl_dj_rsi_sx: parseVal(form.slDjRsiSX),
      sl_dj_rsi_dx: parseVal(form.slDjRsiDX),
      sl_dj_height_sx: parseVal(form.slDjHeightSX),
      sl_dj_height_dx: parseVal(form.slDjHeightDX),
      sl_dj_braking_sx: parseVal(form.slDjBrakingSX),
      sl_dj_braking_dx: parseVal(form.slDjBrakingDX),

      // LSI & Asimmetrie Calcolate
      lsi_quad_calculated: computeLSI(form.legExtSX, form.legExtDX),
      lsi_curl_calculated: computeLSI(form.legCurlSX, form.legCurlDX),
      ecc_braking_asym_calculated: computeLimbAsym(form.eccBrakingSX, form.eccBrakingDX),
      conc_impulse_asym_calculated: computeLimbAsym(form.concImpulseSX, form.concImpulseDX),
      lsi_sl_cmj_height_calculated: computeLSI(form.slCmjHeightSX, form.slCmjHeightDX),
      lsi_sl_cmj_ct_calculated: computeLSI(form.slCmjCtSX, form.slCmjCtDX),
      lsi_sl_cmj_peak_power_calculated: computeLSI(form.slCmjPeakPowerSX, form.slCmjPeakPowerDX),
      lsi_sl_cmj_rsi_calculated: computeLSI(form.slCmjRsiSX || computeRSImod(form.slCmjHeightSX, form.slCmjCtSX), form.slCmjRsiDX || computeRSImod(form.slCmjHeightDX, form.slCmjCtDX)),
      lsi_sl_cmj_ecc_impulse_calculated: computeLSI(form.slCmjEccImpulseSX, form.slCmjEccImpulseDX),
      lsi_sl_dj_ct_calculated: computeLSI(form.slDjCtSX, form.slDjCtDX),
      lsi_sl_dj_rsi_calculated: computeLSI(form.slDjRsiSX, form.slDjRsiDX),
      lsi_sl_dj_height_calculated: computeLSI(form.slDjHeightSX, form.slDjHeightDX),
      lsi_sl_dj_braking_calculated: computeLSI(form.slDjBrakingSX, form.slDjBrakingDX)
    };

    console.log("Dati inviati dal form:", sanitizedData);

    onSaveEvaluation(sanitizedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#0b1329] border border-slate-700/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        
        {/* TOP BAR MODAL HEADER */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#39FF14]/20 border border-[#39FF14]/60 flex items-center justify-center shrink-0 shadow-md shadow-[#39FF14]/20">
              <Plus className="w-5 h-5 text-[#39FF14]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                Nuova Valutazione Clinica LCA (Tutti i Domini)
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Paziente: <strong className="text-white">{patient.nome} {patient.cognome}</strong> | Ginocchio Operato: <strong className="text-[#39FF14] font-bold">{opKnee === 'DX' ? 'Destro (DX)' : 'Sinistro (SX)'}</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* INTESTAZIONE VALUTAZIONE (4 CAMPI SUPERIORI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 bg-slate-950/90 rounded-xl border border-slate-800 shadow-inner">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                Data Valutazione
              </label>
              <input
                type="date"
                required
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono font-bold focus:border-[#39FF14] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                Ginocchio Operato (Riferimento LSI)
              </label>
              <select
                value={opKnee}
                onChange={(e) => setOpKnee(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-emerald-300 font-bold focus:border-[#39FF14] focus:outline-none"
              >
                <option value="DX">🔴 Destro (DX Operato)</option>
                <option value="SX">🔴 Sinistro (SX Operato)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                Fase Riabilitativa
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-cyan-300 font-bold focus:border-[#39FF14] focus:outline-none"
              >
                <option value="Fase 1 (0-6 sett)">🔴 Fase 1: Early Stage (ROM & AMI)</option>
                <option value="Fase 2 (6-12 sett)">🟡 Fase 2: Mid Stage (Landing & Qualità)</option>
                <option value="Fase 3 (3-6 mesi)">🟢 Fase 3: Return to Run & Decel</option>
                <option value="Fase 4 (6-9 mesi)">🔵 Fase 4: Late Stage (CODs & Pliometria)</option>
                <option value="Fase 5 (Oltre 9 mesi / RTS)">🌟 Fase 5: Return to Performance (RTS)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                Valutatore / Esaminatore
              </label>
              <input
                type="text"
                value={evaluator}
                onChange={(e) => setEvaluator(e.target.value)}
                placeholder="N Rehab Team"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-bold focus:border-[#39FF14] focus:outline-none"
              />
            </div>
          </div>

          {/* 🏋️ 1. DOMINIO DELLA FORZA */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#39FF14]" />
                <h4 className="font-extrabold text-white text-sm">
                  1. DOMINIO DELLA FORZA (ISO PUSH & DINAMICA)
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  countForza > 0 ? 'bg-emerald-950 text-[#39FF14] border border-[#39FF14]/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {countForza > 0 ? `${countForza} DATI RACCOLTI` : 'NESSUN DATO'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Iso Push N, Calf Raise 6RM, IMTP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Iso Push Leg Ext */}
              {(() => {
                const lsi = computeLSI(form.legExtSX, form.legExtDX);
                const isOpDX = opKnee === 'DX';
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Iso Push Leg Ext (N)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5 flex justify-between">
                          <span>Left (SX)</span>
                          <span className={!isOpDX ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{!isOpDX ? '🔴 OP' : '🟢 SANO'}</span>
                        </div>
                        <input type="number" step="0.1" placeholder="0.0" value={form.legExtSX} onChange={(e) => handleChange('legExtSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5 flex justify-between">
                          <span>Right (DX)</span>
                          <span className={isOpDX ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{isOpDX ? '🔴 OP' : '🟢 SANO'}</span>
                        </div>
                        <input type="number" step="0.1" placeholder="0.0" value={form.legExtDX} onChange={(e) => handleChange('legExtDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-emerald-400 font-black pt-1 border-t border-slate-800">LSI Quadricipite: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* Iso Push Leg Curl */}
              {(() => {
                const lsi = computeLSI(form.legCurlSX, form.legCurlDX);
                const isOpDX = opKnee === 'DX';
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Iso Push Leg Curl (N)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5 flex justify-between">
                          <span>Left (SX)</span>
                          <span className={!isOpDX ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{!isOpDX ? '🔴 OP' : '🟢 SANO'}</span>
                        </div>
                        <input type="number" step="0.1" placeholder="0.0" value={form.legCurlSX} onChange={(e) => handleChange('legCurlSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5 flex justify-between">
                          <span>Right (DX)</span>
                          <span className={isOpDX ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{isOpDX ? '🔴 OP' : '🟢 SANO'}</span>
                        </div>
                        <input type="number" step="0.1" placeholder="0.0" value={form.legCurlDX} onChange={(e) => handleChange('legCurlDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-cyan-400 font-black pt-1 border-t border-slate-800">LSI Hamstrings: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* Bulgarian 6RM */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                <span className="text-xs font-black text-white block">Bulgarian 6RM (kg)</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[10px]">Left (SX)</label>
                    <input type="number" step="0.1" placeholder="0.0" value={form.bulgarianSX} onChange={(e) => handleChange('bulgarianSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px]">Right (DX)</label>
                    <input type="number" step="0.1" placeholder="0.0" value={form.bulgarianDX} onChange={(e) => handleChange('bulgarianDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 📈 2. CMJ BILATERALE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="font-extrabold text-white text-sm">
                  2. CMJ BILATERALE
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  countCMJ > 0 ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {countCMJ > 0 ? `${countCMJ} DATI RACCOLTI` : 'NESSUN DATO'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Altezza Salto, RSImod, Contraction Time, Peak Power, Eccentric & Concentric Impulse</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Altezza Salto (cm)</label>
                <input type="number" step="0.1" placeholder="es. 33.5" value={form.jumpHeight} onChange={(e) => handleChange('jumpHeight', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-emerald-300 font-mono text-xs font-bold" />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Contraction Time (ms)</label>
                <input type="number" placeholder="es. 610" value={form.contractionTime} onChange={(e) => handleChange('contractionTime', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-300 font-mono text-xs font-bold" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 text-[10px] font-bold">RSImod (m/s)</label>
                  <span className="text-[9px] text-cyan-400 font-mono">JH(m) / CT(s)</span>
                </div>
                <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-300 font-mono text-xs font-black">
                  {computeRSImod(form.jumpHeight, form.contractionTime) || '-'}
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Peak Power (W)</label>
                <input type="number" step="0.1" placeholder="es. 2950" value={form.peakPower} onChange={(e) => handleChange('peakPower', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-emerald-300 font-mono text-xs font-bold" />
              </div>
            </div>

            {/* Scomposizione SX / DX per Impulse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              {/* Eccentric Impulse Left & Right */}
              {(() => {
                const asym = computeLimbAsym(form.eccBrakingSX, form.eccBrakingDX);
                const isRed = asym !== null && parseFloat(asym) > 15;
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Eccentric Impulse (N·s)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Left vs Right</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Left (SX)</label>
                        <input type="number" step="1" placeholder="es. 220" value={form.eccBrakingSX} onChange={(e) => handleChange('eccBrakingSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Right (DX)</label>
                        <input type="number" step="1" placeholder="es. 175" value={form.eccBrakingDX} onChange={(e) => handleChange('eccBrakingDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono text-xs font-bold" />
                      </div>
                    </div>
                    {asym !== null && (
                      <div className={`text-[10px] font-mono font-black pt-1 border-t border-slate-800 flex items-center justify-between ${isRed ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span>Asimmetria Frenata: {asym}%</span>
                        {isRed ? <span className="text-[9px] bg-red-950 px-1.5 py-0.5 rounded border border-red-500/50">⚠️ &gt;15%</span> : <span className="text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/50">✓ OK</span>}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Concentric Impulse Left & Right */}
              {(() => {
                const asym = computeLimbAsym(form.concImpulseSX, form.concImpulseDX);
                const isRed = asym !== null && parseFloat(asym) > 15;
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Concentric Impulse (N·s)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Left vs Right</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Left (SX)</label>
                        <input type="number" step="1" placeholder="es. 210" value={form.concImpulseSX} onChange={(e) => handleChange('concImpulseSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Right (DX)</label>
                        <input type="number" step="1" placeholder="es. 175" value={form.concImpulseDX} onChange={(e) => handleChange('concImpulseDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono text-xs font-bold" />
                      </div>
                    </div>
                    {asym !== null && (
                      <div className={`text-[10px] font-mono font-black pt-1 border-t border-slate-800 flex items-center justify-between ${isRed ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span>Asimmetria Spinta: {asym}%</span>
                        {isRed ? <span className="text-[9px] bg-red-950 px-1.5 py-0.5 rounded border border-red-500/50">⚠️ &gt;15%</span> : <span className="text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/50">✓ OK</span>}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* 🦶 3. CMJ MONOPODALICO (SINGLE LEG CMJ) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-white text-sm">
                  3. CMJ MONOPODALICO (SINGLE LEG CMJ)
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  countSlCmj > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {countSlCmj > 0 ? `${countSlCmj} DATI RACCOLTI` : 'NESSUN DATO'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Altezza Salto, Duration Time, Peak Power/BW, RSI & Braking Impulse</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Altezza Salto (cm) */}
              {(() => {
                const lsi = computeLSI(form.slCmjHeightSX, form.slCmjHeightDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Altezza Salto (cm)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (cm)</label>
                        <input type="number" step="0.1" placeholder="es. 15.5" value={form.slCmjHeightSX} onChange={(e) => handleChange('slCmjHeightSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (cm)</label>
                        <input type="number" step="0.1" placeholder="es. 12.8" value={form.slCmjHeightDX} onChange={(e) => handleChange('slCmjHeightDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-emerald-400 font-black pt-1 border-t border-slate-800">LSI Salto: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* Duration Time (ms) */}
              {(() => {
                const lsi = computeLSI(form.slCmjCtSX, form.slCmjCtDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Duration Time (ms)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (ms)</label>
                        <input type="number" placeholder="es. 620" value={form.slCmjCtSX} onChange={(e) => handleChange('slCmjCtSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (ms)</label>
                        <input type="number" placeholder="es. 650" value={form.slCmjCtDX} onChange={(e) => handleChange('slCmjCtDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-amber-400 font-black pt-1 border-t border-slate-800">LSI Duration: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* Peak Power/BW (W/kg) */}
              {(() => {
                const lsi = computeLSI(form.slCmjPeakPowerSX, form.slCmjPeakPowerDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Peak Power/BW (W/kg)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (W/kg)</label>
                        <input type="number" step="0.1" placeholder="es. 28.5" value={form.slCmjPeakPowerSX} onChange={(e) => handleChange('slCmjPeakPowerSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (W/kg)</label>
                        <input type="number" step="0.1" placeholder="es. 23.4" value={form.slCmjPeakPowerDX} onChange={(e) => handleChange('slCmjPeakPowerDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-[#00e5ff] font-black pt-1 border-t border-slate-800">LSI Peak Power: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* RSI (m/s) */}
              {(() => {
                const rsiSX = form.slCmjRsiSX || computeRSImod(form.slCmjHeightSX, form.slCmjCtSX);
                const rsiDX = form.slCmjRsiDX || computeRSImod(form.slCmjHeightDX, form.slCmjCtDX);
                const lsi = computeLSI(rsiSX, rsiDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">RSI (m/s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (m/s)</label>
                        <input type="number" step="0.01" placeholder="es. 0.25" value={form.slCmjRsiSX} onChange={(e) => handleChange('slCmjRsiSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (m/s)</label>
                        <input type="number" step="0.01" placeholder="es. 0.20" value={form.slCmjRsiDX} onChange={(e) => handleChange('slCmjRsiDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-300 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-emerald-400 font-black pt-1 border-t border-slate-800">LSI RSI: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* Braking Impulse (N·s) */}
              {(() => {
                const lsi = computeLSI(form.slCmjEccImpulseSX, form.slCmjEccImpulseDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Braking Impulse (N·s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (N·s)</label>
                        <input type="number" step="1" placeholder="es. 120" value={form.slCmjEccImpulseSX} onChange={(e) => handleChange('slCmjEccImpulseSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (N·s)</label>
                        <input type="number" step="1" placeholder="es. 98" value={form.slCmjEccImpulseDX} onChange={(e) => handleChange('slCmjEccImpulseDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-cyan-400 font-black pt-1 border-t border-slate-800">LSI Braking Impulse: {lsi}%</div>}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* 📦 4. DROP JUMP BILATERALE (RTP SPECIALIST & DUAL LOAD CELLS) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-400" />
                <h4 className="font-extrabold text-white text-sm">
                  4. DROP JUMP BILATERALE (METRICHE TEMPORALI & FORCE PLATES)
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  countDJ > 0 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {countDJ > 0 ? `${countDJ} DATI RACCOLTI` : 'NESSUN DATO'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Contact Time &lt; 250ms | 3 Metrice Temporali | Dual Load Cells LSI</span>
            </div>

            {/* Sub-grid 1: Parametri Salto & Vincolo GCT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Altezza Caduta Box</label>
                <select
                  value={form.djBoxHeight}
                  onChange={(e) => handleChange('djBoxHeight', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-300 font-mono text-xs font-bold"
                >
                  <option value="30 cm">📦 Box 30 cm</option>
                  <option value="45 cm">📦 Box 45 cm</option>
                  <option value="60 cm">📦 Box 60 cm</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Altezza Salto (cm)</label>
                <input type="number" step="0.1" placeholder="es. 28.5" value={form.djJumpHeight} onChange={(e) => handleChange('djJumpHeight', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-emerald-300 font-mono text-xs font-bold" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 text-[10px] font-bold">Contact Time GCT (ms)</label>
                  <span className="text-[9px] text-amber-400 font-mono font-bold">Vincolo &lt;250ms</span>
                </div>
                <input 
                  type="number" 
                  placeholder="es. 220" 
                  value={form.djContactTime} 
                  onChange={(e) => handleChange('djContactTime', e.target.value)} 
                  className={`w-full bg-slate-950 border rounded-lg p-2.5 font-mono text-xs font-bold ${
                    form.djContactTime && parseFloat(form.djContactTime) >= 250
                      ? 'border-red-500/80 text-red-400 bg-red-950/20'
                      : 'border-slate-700 text-amber-300'
                  }`} 
                />
                {form.djContactTime && parseFloat(form.djContactTime) >= 250 && (
                  <p className="text-[9px] text-red-400 font-bold mt-1">⚠️ Contact Time &gt; 250ms: Non Pliometrico!</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 text-[10px] font-bold">RSI (Reactive Index)</label>
                  <span className="text-[9px] text-emerald-400 font-mono">Target &gt; 2.0</span>
                </div>
                <input type="number" step="0.01" placeholder="es. 2.15" value={form.djRSI} onChange={(e) => handleChange('djRSI', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-emerald-300 font-mono text-xs font-bold" />
              </div>
            </div>

            {/* Sub-grid 2: PANNELLO 3 METRICHE TEMPORALI INDIPENDENTI (RTP Evidenze Scientifiche) */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/90 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Pannello 3 Metriche Temporali Indipendenti (RTP Scientific Panel)
                </span>
                <span className="text-[9.5px] font-mono text-slate-400">Literature Validated (Cormack / Suchomel / Pedley)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Efficienza Pliometrica */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[10.5px] font-extrabold text-slate-200">1. Efficienza Pliometrica (RSI)</div>
                  <div className="text-[9.5px] text-slate-400 leading-tight">Flight Time / Contact Time (GCT &lt; 250ms)</div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400 pt-1 border-t border-slate-800/80">Target Severo: RSI &gt; 2.0</div>
                </div>

                {/* 2. Decelerazione & Controllo Motorio (TTPF) */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] font-extrabold text-slate-200">2. Time to Peak Force (ms)</span>
                    <span className="text-[9px] font-mono text-cyan-400 font-bold">Target 80-120 ms</span>
                  </div>
                  <input type="number" placeholder="es. 95" value={form.djTtpfMs} onChange={(e) => handleChange('djTtpfMs', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-cyan-300 font-mono text-xs font-bold" />
                  {form.djTtpfMs && parseFloat(form.djTtpfMs) < 60 && (
                    <p className="text-[9px] text-red-400 font-bold">⚠️ TTPF &lt; 60ms: Atterraggio Rigido Stiff!</p>
                  )}
                </div>

                {/* 3. Asimmetria Temporale allo Stacco */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] font-extrabold text-slate-200">3. Delta Stacco L vs R (ms)</span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">Target &lt; 10 ms</span>
                  </div>
                  <input type="number" step="0.1" placeholder="es. 4.5" value={form.djTakeoffAsymMs} onChange={(e) => handleChange('djTakeoffAsymMs', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-emerald-300 font-mono text-xs font-bold" />
                </div>
              </div>
            </div>

            {/* Sub-grid 3: Dual Load Cells Force Plates (Landing Peak & Concentric Impulse L/R) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              {/* Landing Peak Force L/R (N) */}
              {(() => {
                const lsi = computeLSI(form.djLandingPeakSX, form.djLandingPeakDX);
                const isFail = lsi !== null && parseFloat(lsi) < 90;
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Landing Peak Force (N)</span>
                      <span className="text-[10px] font-mono text-slate-400">Target LSI &ge; 90%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Left (SX)</label>
                        <input type="number" step="1" placeholder="es. 2450" value={form.djLandingPeakSX} onChange={(e) => handleChange('djLandingPeakSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Right (DX)</label>
                        <input type="number" step="1" placeholder="es. 2320" value={form.djLandingPeakDX} onChange={(e) => handleChange('djLandingPeakDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono text-xs font-bold" />
                      </div>
                    </div>
                    {lsi !== null && (
                      <div className={`text-[10px] font-mono font-black pt-1 border-t border-slate-800 flex items-center justify-between ${isFail ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span>LSI Picco Atterraggio: {lsi}%</span>
                        {isFail ? <span className="text-[9px] bg-red-950 px-1.5 py-0.5 rounded border border-red-500/50">⚠️ &lt; 90%</span> : <span className="text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/50">✓ OK</span>}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Concentric Impulse L/R (N·s) */}
              {(() => {
                const lsi = computeLSI(form.djConcImpulseSX, form.djConcImpulseDX);
                const isFail = lsi !== null && parseFloat(lsi) < 95;
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Concentric Impulse (N·s)</span>
                      <span className="text-[10px] font-mono text-slate-400">Target LSI &ge; 95%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Left (SX)</label>
                        <input type="number" step="1" placeholder="es. 215" value={form.djConcImpulseSX} onChange={(e) => handleChange('djConcImpulseSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Right (DX)</label>
                        <input type="number" step="1" placeholder="es. 210" value={form.djConcImpulseDX} onChange={(e) => handleChange('djConcImpulseDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono text-xs font-bold" />
                      </div>
                    </div>
                    {lsi !== null && (
                      <div className={`text-[10px] font-mono font-black pt-1 border-t border-slate-800 flex items-center justify-between ${isFail ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span>LSI Impulso Concentrico: {lsi}%</span>
                        {isFail ? <span className="text-[9px] bg-red-950 px-1.5 py-0.5 rounded border border-red-500/50">⚠️ &lt; 95%</span> : <span className="text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/50">✓ OK</span>}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* ⚡ 5. SL DROP JUMP (MONOPODALICO) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-white text-sm">
                  5. SL DROP JUMP (MONOPODALICO)
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  countSlDj > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {countSlDj > 0 ? `${countSlDj} DATI RACCOLTI` : 'NESSUN DATO'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Box Selector, Contact Time, RSI, Altezza Salto & Braking Impulse (SX vs DX)</span>
            </div>

            <div className="mb-3 w-48">
              <label className="block text-slate-400 text-[10px] font-bold mb-1">Altezza Caduta Box Selector</label>
              <select
                value={form.slDjBoxHeight}
                onChange={(e) => handleChange('slDjBoxHeight', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs font-bold"
              >
                <option value="30 cm">📦 Box 30 cm</option>
                <option value="45 cm">📦 Box 45 cm</option>
                <option value="60 cm">📦 Box 60 cm</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Ground Contact Time (ms) */}
              {(() => {
                const lsi = computeLSI(form.slDjCtSX, form.slDjCtDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Ground Contact Time (ms)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (ms)</label>
                        <input type="number" placeholder="es. 380" value={form.slDjCtSX} onChange={(e) => handleChange('slDjCtSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (ms)</label>
                        <input type="number" placeholder="es. 420" value={form.slDjCtDX} onChange={(e) => handleChange('slDjCtDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-amber-400 font-black pt-1 border-t border-slate-800">LSI Contact Time: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* RSI (m/s) */}
              {(() => {
                const lsi = computeLSI(form.slDjRsiSX, form.slDjRsiDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">RSI (m/s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (m/s)</label>
                        <input type="number" step="0.01" placeholder="es. 0.34" value={form.slDjRsiSX} onChange={(e) => handleChange('slDjRsiSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (m/s)</label>
                        <input type="number" step="0.01" placeholder="es. 0.28" value={form.slDjRsiDX} onChange={(e) => handleChange('slDjRsiDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-300 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-emerald-400 font-black pt-1 border-t border-slate-800">LSI RSI: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* Altezza Salto (cm) */}
              {(() => {
                const lsi = computeLSI(form.slDjHeightSX, form.slDjHeightDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Altezza Salto (cm)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (cm)</label>
                        <input type="number" step="0.1" placeholder="es. 12.5" value={form.slDjHeightSX} onChange={(e) => handleChange('slDjHeightSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (cm)</label>
                        <input type="number" step="0.1" placeholder="es. 10.2" value={form.slDjHeightDX} onChange={(e) => handleChange('slDjHeightDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-[#00e5ff] font-black pt-1 border-t border-slate-800">LSI Altezza: {lsi}%</div>}
                  </div>
                );
              })()}

              {/* Braking Impulse (N·s) */}
              {(() => {
                const lsi = computeLSI(form.slDjBrakingSX, form.slDjBrakingDX);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <span className="text-xs font-black text-white block">Braking Impulse (N·s)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 text-[10px]">SX (N·s)</label>
                        <input type="number" step="1" placeholder="es. 95" value={form.slDjBrakingSX} onChange={(e) => handleChange('slDjBrakingSX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">DX (N·s)</label>
                        <input type="number" step="1" placeholder="es. 78" value={form.slDjBrakingDX} onChange={(e) => handleChange('slDjBrakingDX', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-400 font-mono" />
                      </div>
                    </div>
                    {lsi !== null && <div className="text-[10px] font-mono text-cyan-400 font-black pt-1 border-t border-slate-800">LSI Braking Impulse: {lsi}%</div>}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              Annulla
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-[#39FF14] text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-emerald-950/60 border border-[#39FF14] hover:brightness-110 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 fill-slate-950 text-[#39FF14]" />
              <span>Registra Valutazione Clinica Completa</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
