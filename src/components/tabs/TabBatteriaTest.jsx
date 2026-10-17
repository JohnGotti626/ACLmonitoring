import React, { useState } from 'react';
import { 
  Calendar, 
  Trophy, 
  TrendingUp, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Activity, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Dumbbell,
  Package,
  CheckSquare,
  Check,
  Box
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ModalNuovaValutazione from '../ModalNuovaValutazione';
import GraficoMultimetrica from '../GraficoMultimetrica';
import { createTestObject, saveTestToSupabase, sortTestsByDate, getLastValidMetricValue, getLastValidMetricWithMeta } from '../../utils/testUtils';
import { UIErrorBoundary } from '../UIErrorBoundary';

// Helper di sicurezza per parsing numerico senza crash di runtime
const safeNum = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '' || val === '-') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

const safeFixed = (val, decimals = 1, fallback = 'N/D') => {
  if (val === null || val === undefined || val === '' || val === '-') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n.toFixed(decimals);
};

const calcRatioLsi = (val1, val2) => {
  if (val1 === undefined || val1 === null || val1 === '' || val1 === '-') return null;
  if (val2 === undefined || val2 === null || val2 === '' || val2 === '-') return null;
  const n1 = typeof val1 === 'number' ? val1 : parseFloat(String(val1).replace(',', '.'));
  const n2 = typeof val2 === 'number' ? val2 : parseFloat(String(val2).replace(',', '.'));
  if (isNaN(n1) || isNaN(n2) || n1 <= 0 || n2 <= 0) return null;
  const max = Math.max(n1, n2);
  if (max === 0) return null;
  return ((Math.min(n1, n2) / max) * 100).toFixed(1);
};

export default function TabBatteriaTest({ patient, activePhase, onChangePhase, onSaveTest }) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  // State Modal Nuova Valutazione Clinica
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  // Sub-Tab Superiori a Sinistra (Default: CMJ Bilaterale)
  const [activeSubTab, setActiveSubTab] = useState('CMJ_BILATERAL'); // 'LSI', 'FORZA', 'CMJ_BILATERAL', 'CMJ_SL', 'DJ_BILATERAL', 'DJ_SL'

  // Mapper fase riabilitativa -> chiave fase per la Batteria Test
  const getPhaseKeyForBatteria = (fase) => {
    if (!fase) return 'Fase 3 (>80%)';
    const str = String(fase).toLowerCase();
    if (str.includes('1') || str.includes('early') || str.includes('rom')) return 'Fase 1';
    if (str.includes('2') || str.includes('mid') || str.includes('forza')) return 'Fase 2 (>70%)';
    if (str.includes('3') || str.includes('run') || str.includes('power') || str.includes('drills')) return 'Fase 3 (>80%)';
    if (str.includes('4') || str.includes('late') || str.includes('cod') || str.includes('agility')) return 'Fase 4';
    if (str.includes('5') || str.includes('perf') || str.includes('rts') || str.includes('sport') || str.includes('play')) return 'Fase 5 (RTS)';
    return 'Fase 3 (>80%)';
  };

  // Fase Target Selezionata a Destra (Sincronizzata di default con la Fase Attiva del paziente)
  const [selectedPhase, setSelectedPhase] = useState(() => getPhaseKeyForBatteria(patient?.fase_riabilitativa || activePhase));

  // Sincronizzazione automatica quando viene cambiata la fase nelle Direttive Operative
  React.useEffect(() => {
    const currentActive = patient?.fase_riabilitativa || activePhase;
    if (currentActive) {
      setSelectedPhase(getPhaseKeyForBatteria(currentActive));
    }
  }, [patient?.fase_riabilitativa, activePhase]);

  // CHECKLIST QUALITATIVA FASE 2
  const [phase2Checklist, setPhase2Checklist] = useState({
    extensionComplete: true, 
    noEffusion: true,        
    singleLegSquat: true,    
    pogoJump: false,         
    landingStrategies: true  
  });

  // CHECKLIST QUALITATIVA FASE 3
  const [phase3Checklist, setPhase3Checklist] = useState({
    runningCurriculum: true,   
    treadmillMechanics: true,  
    noEffusionPostLoad: true   
  });

  // CHECKLIST QUALITATIVA FASE 4
  const [phase4Checklist, setPhase4Checklist] = useState({
    slDropJumpBox30: true,     
    firstFieldTech: true,      
    weeklyLoadTolerance: true  
  });

  // STORICO TEST REGISTRATI NEL TEMPO (ordinati cronologicamente per data di esecuzione)
  const [testsHistory, setTestsHistory] = useState(() => {
    return sortTestsByDate(patient?.tests);
  });
  const [selectedTestId, setSelectedTestId] = useState(() => {
    const cleanTests = sortTestsByDate(patient?.tests);
    return cleanTests.length > 0 ? cleanTests[cleanTests.length - 1].id : null;
  });

  // Sincronizzazione dinamica quando cambia il paziente o i suoi test
  React.useEffect(() => {
    const cleanTests = sortTestsByDate(patient?.tests);
    setTestsHistory(cleanTests);
    if (cleanTests.length > 0) {
      setSelectedTestId(cleanTests[cleanTests.length - 1].id);
    } else {
      setSelectedTestId(null);
    }
  }, [patient?.id, patient?.tests]);

  const activeTest = testsHistory.find(t => t.id === selectedTestId) || (testsHistory.length > 0 ? testsHistory[testsHistory.length - 1] : null);

  // CONFIGURAZIONE CLINICA FASI & TARGET
  const phaseConfig = {
    'Fase 1': { 
      name: '🔴 FASE 1: Early Stage (ROM & AMI)', 
      isEarlyStage: true 
    },
    'Fase 2 (>70%)': { 
      name: '🟡 FASE 2: Mid Stage (Qualità & Landing)', 
      isPhase2: true
    },
    'Fase 3 (>80%)': { 
      name: '🟢 FASE 3: Return to Run & Decel', 
      isPhase3: true
    },
    'Fase 4': { 
      name: '🔵 FASE 4: Late Stage (ASPETAR Pliometria & Potenza)', 
      isPhase4: true
    },
    'Fase 5 (RTS)': { 
      name: '🌟 FASE 5: Return to Performance (Match Play)', 
      targetLSIQuad: 95, 
      targetQuadNmKg: 3.0, 
      targetLSIHam: 95, 
      targetRSI: 2.0 
    }
  };

  const currentPhase = phaseConfig[selectedPhase] || phaseConfig['Fase 3 (>80%)'];

  // CONFIGURAZIONE BICCHIERI PRESTATIVI
  let cupsData = [];

  if (!testsHistory || testsHistory.length === 0) {
    cupsData = [];
  } else if (currentPhase.isEarlyStage) {
    cupsData = [
      {
        id: 'early_stage_info',
        title: 'FASE 1: PRE-TEST',
        subtitle: '(ROM & Estensione 0°)',
        displayVal: '0.0° / 0°',
        targetLabel: 'Target: Estensione Completa 0°',
        percentageAchieved: 100,
        isOk: true,
        earlyNote: 'In questa prima fase il focus è sul recupero del gonfiore, ROM e controllo artrogeno. Test ad alto carico rimandati alla Fase 2.'
      }
    ];
  } else if (currentPhase.isPhase2) {
    const lsiQuadMeta = getLastValidMetricWithMeta(testsHistory, ['lsiQuad', 'lsi_quad_calculated']);
    const quadOpNmKgMeta = getLastValidMetricWithMeta(testsHistory, ['quadOpNmKg', 'quad_rel_op']);
    const lsiFlexMeta = getLastValidMetricWithMeta(testsHistory, ['lsiFlex', 'lsi_curl_calculated']);
    const quadOpMeta = getLastValidMetricWithMeta(testsHistory, ['quadOp', 'iso_leg_ext_dx', 'iso_leg_ext_sx']);
    const flexOpMeta = getLastValidMetricWithMeta(testsHistory, ['flexOp', 'iso_leg_curl_dx', 'iso_leg_curl_sx']);
    const ikdcMeta = getLastValidMetricWithMeta(testsHistory, ['ikdc', 'ikdc_score']);

    const lsiQuadVal = lsiQuadMeta?.value ?? null;
    const quadOpNmKgVal = quadOpNmKgMeta?.value ?? null;
    const lsiFlexVal = lsiFlexMeta?.value ?? null;
    const quadOpVal = quadOpMeta?.value ?? null;
    const flexOpVal = flexOpMeta?.value ?? null;
    const hqRatioVal = (quadOpVal !== null && flexOpVal !== null && quadOpVal > 0) ? flexOpVal / quadOpVal : null;
    const ikdcVal = ikdcMeta?.value ?? null;

    cupsData = [
      {
        id: 'lsi_quad',
        title: 'LSI QUADRICIPITE',
        subtitle: '(ISO Push Leg Ext...)',
        value: lsiQuadVal,
        meta: lsiQuadMeta,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >70%',
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / 70) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= 70 : false
      },
      {
        id: 'quad_rel_op',
        title: 'FORZA REL. QUAD OP',
        subtitle: '(Nm/kg Peso Corporeo)',
        value: quadOpNmKgVal,
        meta: quadOpNmKgMeta,
        displayVal: quadOpNmKgVal !== null ? `${safeFixed(quadOpNmKgVal, 2)} Nm/kg` : 'N/D',
        targetLabel: 'Target: >2.0 Nm/kg',
        percentageAchieved: quadOpNmKgVal !== null ? Math.round((quadOpNmKgVal / 2.0) * 100) : 0,
        isOk: quadOpNmKgVal !== null ? quadOpNmKgVal >= 2.0 : false
      },
      {
        id: 'lsi_flex',
        title: 'LSI HAMSTRING',
        subtitle: '(ISO Push Leg Curl...)',
        value: lsiFlexVal,
        meta: lsiFlexMeta,
        displayVal: lsiFlexVal !== null ? `${safeFixed(lsiFlexVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >70%',
        percentageAchieved: lsiFlexVal !== null ? Math.round((lsiFlexVal / 70) * 100) : 0,
        isOk: lsiFlexVal !== null ? lsiFlexVal >= 70 : false
      },
      {
        id: 'hq_ratio',
        title: 'H/Q RATIO ISOMETRICO',
        subtitle: '(Flex OP / Quad OP)',
        value: hqRatioVal,
        meta: flexOpMeta || quadOpMeta,
        displayVal: hqRatioVal !== null ? `${safeFixed(hqRatioVal, 2)}` : 'N/D',
        targetLabel: 'Target: >0.55',
        percentageAchieved: hqRatioVal !== null ? Math.round((hqRatioVal / 0.55) * 100) : 0,
        isOk: hqRatioVal !== null ? hqRatioVal >= 0.55 : false
      },
      {
        id: 'ikdc_score',
        title: 'SCORE IKDC',
        subtitle: '(Prontitudine Clinica)',
        value: ikdcVal,
        meta: ikdcMeta,
        displayVal: ikdcVal !== null ? `${safeFixed(ikdcVal, 1)}/100` : 'N/D',
        targetLabel: 'Target: >64/100',
        percentageAchieved: ikdcVal !== null ? Math.round((ikdcVal / 64) * 100) : 0,
        isOk: ikdcVal !== null ? ikdcVal >= 64 : false
      }
    ];
  } else if (currentPhase.isPhase3) {
    const lsiQuadMeta = getLastValidMetricWithMeta(testsHistory, ['lsiQuad', 'lsi_quad_calculated']);
    const lsiFlexMeta = getLastValidMetricWithMeta(testsHistory, ['lsiFlex', 'lsi_curl_calculated']);
    const cmjImpulseLsiMeta = getLastValidMetricWithMeta(testsHistory, ['cmjImpulseLsi', 'lsi_cmj_braking']);
    const slCmjHeightLsiMeta = getLastValidMetricWithMeta(testsHistory, ['slCmjHeightLsi', 'lsi_sl_cmj_height_calculated']);
    const rsiDropJumpMeta = getLastValidMetricWithMeta(testsHistory, ['rsiDropJump', 'djRSI', 'dj_rsi', 'rsi_drop_jump']);

    const lsiQuadVal = lsiQuadMeta?.value ?? null;
    const lsiFlexVal = lsiFlexMeta?.value ?? null;
    const cmjImpulseLsiVal = cmjImpulseLsiMeta?.value ?? null;
    const slCmjHeightLsiVal = slCmjHeightLsiMeta?.value ?? null;
    const rsiDropJumpVal = rsiDropJumpMeta?.value ?? null;

    cupsData = [
      {
        id: 'lsi_quad_3',
        title: 'LSI QUADRICIPITE',
        subtitle: '(Iso Push Leg Ext)',
        value: lsiQuadVal,
        meta: lsiQuadMeta,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >80%',
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / 80) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= 80 : false
      },
      {
        id: 'lsi_ham_3',
        title: 'LSI HAMSTRING',
        subtitle: '(Iso Push Leg Curl)',
        value: lsiFlexVal,
        meta: lsiFlexMeta,
        displayVal: lsiFlexVal !== null ? `${safeFixed(lsiFlexVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >80%',
        percentageAchieved: lsiFlexVal !== null ? Math.round((lsiFlexVal / 80) * 100) : 0,
        isOk: lsiFlexVal !== null ? lsiFlexVal >= 80 : false
      },
      {
        id: 'cmj_braking_3',
        title: 'LSI BRAKING IMPULSE',
        subtitle: '(CMJ Braking Imp)',
        value: cmjImpulseLsiVal,
        meta: cmjImpulseLsiMeta,
        displayVal: cmjImpulseLsiVal !== null ? `${safeFixed(cmjImpulseLsiVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >80%',
        percentageAchieved: cmjImpulseLsiVal !== null ? Math.round((cmjImpulseLsiVal / 80) * 100) : 0,
        isOk: cmjImpulseLsiVal !== null ? cmjImpulseLsiVal >= 80 : false
      },
      {
        id: 'lsi_height_3',
        title: 'SL CMJ HEIGHT LSI',
        subtitle: '(Single Leg Jump)',
        value: slCmjHeightLsiVal,
        meta: slCmjHeightLsiMeta,
        displayVal: slCmjHeightLsiVal !== null ? `${safeFixed(slCmjHeightLsiVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >80%',
        percentageAchieved: slCmjHeightLsiVal !== null ? Math.round((slCmjHeightLsiVal / 80) * 100) : 0,
        isOk: slCmjHeightLsiVal !== null ? slCmjHeightLsiVal >= 80 : false
      },
      {
        id: 'rsi_dj_3',
        title: 'DL DROP JUMP RSI',
        subtitle: '(Double Leg Box)',
        value: rsiDropJumpVal,
        meta: rsiDropJumpMeta,
        displayVal: rsiDropJumpVal !== null ? `${safeFixed(rsiDropJumpVal, 2)} idx` : 'N/D',
        targetLabel: 'Target: >1.20 idx',
        percentageAchieved: rsiDropJumpVal !== null ? Math.round((rsiDropJumpVal / 1.20) * 100) : 0,
        isOk: rsiDropJumpVal !== null ? rsiDropJumpVal >= 1.20 : false
      }
    ];
  } else if (currentPhase.isPhase4) {
    const lsiQuadMeta = getLastValidMetricWithMeta(testsHistory, ['lsiQuad', 'lsi_quad_calculated']);
    const lsiFlexMeta = getLastValidMetricWithMeta(testsHistory, ['lsiFlex', 'lsi_curl_calculated']);
    const cmjAsymLsiMeta = getLastValidMetricWithMeta(testsHistory, ['cmjImpulseLsi', 'lsi_cmj_braking']);
    const slCmjHeightLsiMeta = getLastValidMetricWithMeta(testsHistory, ['slCmjHeightLsi', 'lsi_sl_cmj_height_calculated']);
    const rsiDropJumpMeta = getLastValidMetricWithMeta(testsHistory, ['rsiDropJump', 'djRSI', 'dj_rsi', 'rsi_drop_jump']);
    const aclrsiMeta = getLastValidMetricWithMeta(testsHistory, ['aclrsi', 'acl_rsi']);

    const lsiQuadVal = lsiQuadMeta?.value ?? null;
    const lsiFlexVal = lsiFlexMeta?.value ?? null;
    const cmjAsymLsi = cmjAsymLsiMeta?.value ?? null;
    const slCmjHeightLsiVal = slCmjHeightLsiMeta?.value ?? null;
    const rsiDropJumpVal = rsiDropJumpMeta?.value ?? null;
    const aclrsiVal = aclrsiMeta?.value ?? null;

    cupsData = [
      {
        id: 'lsi_quad_p4',
        title: 'LSI QUADRICIPITE',
        subtitle: '(Iso Push Leg Ext)',
        value: lsiQuadVal,
        meta: lsiQuadMeta,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >85%',
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / 85) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= 85 : false
      },
      {
        id: 'lsi_ham_p4',
        title: 'LSI HAMSTRING',
        subtitle: '(Iso Push Leg Curl)',
        value: lsiFlexVal,
        meta: lsiFlexMeta,
        displayVal: lsiFlexVal !== null ? `${safeFixed(lsiFlexVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >85%',
        percentageAchieved: lsiFlexVal !== null ? Math.round((lsiFlexVal / 85) * 100) : 0,
        isOk: lsiFlexVal !== null ? lsiFlexVal >= 85 : false
      },
      {
        id: 'cmj_braking_p4',
        title: 'LSI BRAKING IMPULSE',
        subtitle: '(CMJ Braking Imp)',
        value: cmjAsymLsi,
        meta: cmjAsymLsiMeta,
        displayVal: cmjAsymLsi !== null ? `${safeFixed(cmjAsymLsi, 1)}% LSI` : 'N/D',
        targetLabel: 'Target: >85%',
        percentageAchieved: cmjAsymLsi !== null ? Math.round((cmjAsymLsi / 85) * 100) : 0,
        isOk: cmjAsymLsi !== null ? cmjAsymLsi >= 85 : false
      },
      {
        id: 'sl_cmj_p4',
        title: 'SL CMJ HEIGHT LSI',
        subtitle: '(Single Leg Jump)',
        value: slCmjHeightLsiVal,
        meta: slCmjHeightLsiMeta,
        displayVal: slCmjHeightLsiVal !== null ? `${safeFixed(slCmjHeightLsiVal, 1)}%` : 'N/D',
        targetLabel: 'Target: >85%',
        percentageAchieved: slCmjHeightLsiVal !== null ? Math.round((slCmjHeightLsiVal / 85) * 100) : 0,
        isOk: slCmjHeightLsiVal !== null ? slCmjHeightLsiVal >= 85 : false
      },
      {
        id: 'dl_dj_p4',
        title: 'DL DROP JUMP RSI',
        subtitle: '(Double Leg Box)',
        value: rsiDropJumpVal,
        meta: rsiDropJumpMeta,
        displayVal: rsiDropJumpVal !== null ? `${safeFixed(rsiDropJumpVal, 2)} idx` : 'N/D',
        targetLabel: 'Target: >1.30 idx',
        percentageAchieved: rsiDropJumpVal !== null ? Math.round((rsiDropJumpVal / 1.30) * 100) : 0,
        isOk: rsiDropJumpVal !== null ? rsiDropJumpVal >= 1.30 : false
      },
      {
        id: 'aclrsi_p4',
        title: 'SCORE ACL-RSI',
        subtitle: '(Prontitudine Psico)',
        value: aclrsiVal,
        meta: aclrsiMeta,
        displayVal: aclrsiVal !== null ? `${safeFixed(aclrsiVal, 1)}/100` : 'N/D',
        targetLabel: 'Target: >65/100',
        percentageAchieved: aclrsiVal !== null ? Math.round((aclrsiVal / 65) * 100) : 0,
        isOk: aclrsiVal !== null ? aclrsiVal >= 65 : false
      }
    ];
  } else {
    const lsiQuadMeta = getLastValidMetricWithMeta(testsHistory, ['lsiQuad', 'lsi_quad_calculated']);
    const quadOpNmKgMeta = getLastValidMetricWithMeta(testsHistory, ['quadOpNmKg', 'quad_rel_op']);
    const rsiDropJumpMeta = getLastValidMetricWithMeta(testsHistory, ['rsiDropJump', 'djRSI', 'dj_rsi', 'rsi_drop_jump']);

    const lsiQuadVal = lsiQuadMeta?.value ?? null;
    const quadOpNmKgVal = quadOpNmKgMeta?.value ?? null;
    const rsiDropJumpVal = rsiDropJumpMeta?.value ?? null;

    const targetQuadLSI = currentPhase.targetLSIQuad || 95;
    const targetNmKg = currentPhase.targetQuadNmKg || 3.0;
    const targetRsi = currentPhase.targetRSI || 2.0;

    cupsData = [
      {
        id: 'lsi_quad',
        title: 'LSI QUADRICIPITE',
        subtitle: '(Iso Push Leg Ext)',
        value: lsiQuadVal,
        meta: lsiQuadMeta,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'N/D',
        targetLabel: `Target: >${targetQuadLSI}%`,
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / targetQuadLSI) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= targetQuadLSI : false
      },
      {
        id: 'quad_nm_kg',
        title: 'FORZA RELATIVA QUAD',
        subtitle: '(Nm/kg peso corporeo)',
        value: quadOpNmKgVal,
        meta: quadOpNmKgMeta,
        displayVal: quadOpNmKgVal !== null ? `${safeFixed(quadOpNmKgVal, 2)} Nm/kg` : 'N/D',
        targetLabel: `Target: >${targetNmKg} Nm/kg`,
        percentageAchieved: quadOpNmKgVal !== null ? Math.round((quadOpNmKgVal / targetNmKg) * 100) : 0,
        isOk: quadOpNmKgVal !== null ? quadOpNmKgVal >= targetNmKg : false
      },
      {
        id: 'rsi_drop_jump',
        title: 'RSI DROP JUMP',
        subtitle: '(Contact Time <250ms)',
        value: rsiDropJumpVal,
        meta: rsiDropJumpMeta,
        displayVal: rsiDropJumpVal !== null ? `${safeFixed(rsiDropJumpVal, 2)} rsi` : 'N/D',
        targetLabel: `Target: >${targetRsi} rsi`,
        percentageAchieved: rsiDropJumpVal !== null ? Math.round((rsiDropJumpVal / targetRsi) * 100) : 0,
        isOk: rsiDropJumpVal !== null ? rsiDropJumpVal >= targetRsi : false
      }
    ];
  }

  // Gestore salvataggio o modifica test da Modal (preserva SEMPRE i valori esistenti se il campo non è compilato)
  const handleModalSave = async (newValData) => {
    const targetId = newValData.id || editingTest?.id;
    const isEditing = !!targetId;

    const keepIfValid = (newVal, existingVal) => {
      if (newVal === null || newVal === undefined || newVal === '') return existingVal;
      const num = typeof newVal === 'number' ? newVal : parseFloat(String(newVal).replace(',', '.'));
      return !isNaN(num) && num > 0 ? num : existingVal;
    };

    if (isEditing) {
      const updated = testsHistory.map((existingTest) => {
        if (existingTest.id === targetId) {
          const updatedTest = {
            ...existingTest,
            patient_id: patient?.id || existingTest.patient_id,
            patientId: patient?.id || existingTest.patientId,
            date: newValData.data_valutazione ? newValData.data_valutazione.split('-').reverse().join('/') : existingTest.date,
            data_valutazione: newValData.data_valutazione || existingTest.data_valutazione,
            lsiQuad: keepIfValid(newValData.lsi_quad_calculated, existingTest.lsiQuad),
            lsiFlex: keepIfValid(newValData.lsi_curl_calculated, existingTest.lsiFlex),
            quadSano: keepIfValid(newValData.iso_leg_ext_sx, existingTest.quadSano),
            quadOp: keepIfValid(newValData.iso_leg_ext_dx, existingTest.quadOp),
            flexSano: keepIfValid(newValData.iso_leg_curl_sx, existingTest.flexSano),
            flexOp: keepIfValid(newValData.iso_leg_curl_dx, existingTest.flexOp),
            calfRaiseSX: keepIfValid(newValData.calf_raise_sx, existingTest.calfRaiseSX),
            calfRaiseDX: keepIfValid(newValData.calf_raise_dx, existingTest.calfRaiseDX),
            soleoSX: keepIfValid(newValData.soleo_sx, existingTest.soleoSX),
            soleoDX: keepIfValid(newValData.soleo_dx, existingTest.soleoDX),
            bulgarianSX: keepIfValid(newValData.bulgarian_sx, existingTest.bulgarianSX),
            bulgarianDX: keepIfValid(newValData.bulgarian_dx, existingTest.bulgarianDX),
            imtpForce: keepIfValid(newValData.imtp_peak_force, existingTest.imtpForce),
            jumpHeight: keepIfValid(newValData.jump_height_cm, existingTest.jumpHeight),
            contractionTime: keepIfValid(newValData.contraction_time_ms, existingTest.contractionTime),
            peakPower: keepIfValid(newValData.peak_power_w, existingTest.peakPower),
            cmjDepth: keepIfValid(newValData.cmj_depth, existingTest.cmjDepth),
            eccBrakingRfd: keepIfValid(newValData.ecc_braking_rfd, existingTest.eccBrakingRfd),
            rsiCmj: keepIfValid(newValData.rsi_cmj, existingTest.rsiCmj),
            eccBrakingSX: keepIfValid(newValData.ecc_braking_sx, existingTest.eccBrakingSX),
            eccBrakingDX: keepIfValid(newValData.ecc_braking_dx, existingTest.eccBrakingDX),
            concImpulseSX: keepIfValid(newValData.conc_impulse_sx, existingTest.concImpulseSX),
            concImpulseDX: keepIfValid(newValData.conc_impulse_dx, existingTest.concImpulseDX),
            slCmjHeightSX: keepIfValid(newValData.sl_cmj_height_sx, existingTest.slCmjHeightSX),
            slCmjHeightDX: keepIfValid(newValData.sl_cmj_height_dx, existingTest.slCmjHeightDX),
            slCmjCtSX: keepIfValid(newValData.sl_cmj_ct_sx, existingTest.slCmjCtSX),
            slCmjCtDX: keepIfValid(newValData.sl_cmj_ct_dx, existingTest.slCmjCtDX),
            slCmjPeakPowerSX: keepIfValid(newValData.sl_cmj_peak_power_sx, existingTest.slCmjPeakPowerSX),
            slCmjPeakPowerDX: keepIfValid(newValData.sl_cmj_peak_power_dx, existingTest.slCmjPeakPowerDX),
            slCmjRsiSX: keepIfValid(newValData.sl_cmj_rsi_sx, existingTest.slCmjRsiSX),
            slCmjRsiDX: keepIfValid(newValData.sl_cmj_rsi_dx, existingTest.slCmjRsiDX),
            slCmjDepthSX: keepIfValid(newValData.sl_cmj_depth_sx, existingTest.slCmjDepthSX),
            slCmjDepthDX: keepIfValid(newValData.sl_cmj_depth_dx, existingTest.slCmjDepthDX),
            slCmjEccImpulseSX: keepIfValid(newValData.sl_cmj_ecc_impulse_sx, existingTest.slCmjEccImpulseSX),
            slCmjEccImpulseDX: keepIfValid(newValData.sl_cmj_ecc_impulse_dx, existingTest.slCmjEccImpulseDX),
            djBoxHeight: newValData.dj_box_height || existingTest.djBoxHeight,
            djContactTime: keepIfValid(newValData.dj_contact_time, existingTest.djContactTime),
            rsiDropJump: keepIfValid(newValData.dj_rsi, existingTest.rsiDropJump),
            djBrakingForce: keepIfValid(newValData.dj_braking_force, existingTest.djBrakingForce),
            djBrakingImpulse: keepIfValid(newValData.dj_braking_impulse, existingTest.djBrakingImpulse),
            slDjBoxHeight: newValData.sl_dj_box_height || existingTest.slDjBoxHeight,
            slDjCtSX: keepIfValid(newValData.sl_dj_ct_sx, existingTest.slDjCtSX),
            slDjCtDX: keepIfValid(newValData.sl_dj_ct_dx, existingTest.slDjCtDX),
            slDjRsiSX: keepIfValid(newValData.sl_dj_rsi_sx, existingTest.slDjRsiSX),
            slDjRsiDX: keepIfValid(newValData.sl_dj_rsi_dx, existingTest.slDjRsiDX),
            slDjHeightSX: keepIfValid(newValData.sl_dj_height_sx, existingTest.slDjHeightSX),
            slDjHeightDX: keepIfValid(newValData.sl_dj_height_dx, existingTest.slDjHeightDX),
            slDjBrakingSX: keepIfValid(newValData.sl_dj_braking_sx, existingTest.slDjBrakingSX),
            slDjBrakingDX: keepIfValid(newValData.sl_dj_braking_dx, existingTest.slDjBrakingDX),
            brakingAsym: keepIfValid(newValData.ecc_braking_asym_calculated, existingTest.brakingAsym),
            cmjImpulseLsi: newValData.ecc_braking_asym_calculated ? parseFloat((100 - parseFloat(newValData.ecc_braking_asym_calculated)).toFixed(1)) : existingTest.cmjImpulseLsi,
            slCmjHeightLsi: keepIfValid(newValData.lsi_sl_cmj_height_calculated, existingTest.slCmjHeightLsi),
            slCmjDepthLsi: keepIfValid(newValData.lsi_sl_cmj_depth_calculated, existingTest.slCmjDepthLsi),
            slDjRsiLsi: keepIfValid(newValData.lsi_sl_dj_rsi_calculated, existingTest.slDjRsiLsi)
          };
          console.log("Dati inviati (modifica test):", updatedTest);
          saveTestToSupabase(updatedTest);
          return updatedTest;
        }
        return existingTest;
      });

      const sortedUpdated = sortTestsByDate(updated);
      setTestsHistory(sortedUpdated);
      setSelectedTestId(targetId);
      setEditingTest(null);

      if (onSaveTest) {
        onSaveTest(sortedUpdated);
      }
    } else {
      const newNum = testsHistory.length + 1;
      const newTest = createTestObject(newValData, patient?.id, newNum);

      console.log("Dati inviati:", newTest);

      await saveTestToSupabase(newTest);

      const sortedAll = sortTestsByDate([...testsHistory, newTest]);
      setTestsHistory(sortedAll);
      setSelectedTestId(newTest.id);
      setEditingTest(null);

      if (onSaveTest) {
        onSaveTest(sortedAll);
      }
    }
  };

  // REQUISITI 1, 2, 3, 4: SOTTO-TAB PER TUTTE LE PRESTAZIONI DI SALTO
  const getSubTabRows = () => {
    switch (activeSubTab) {
      case 'LSI':
        return [
          { key: 'lsiQuad', deltaKey: 'lsiQuadDelta', label: 'LSI Quadricipite Iso Push', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'lsiFlex', deltaKey: 'lsiFlexDelta', label: 'LSI Ischiocrurali Leg Curl', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'lsiSingleHop', deltaKey: 'lsiSingleHopDelta', label: 'LSI Single Hop Test', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'lsiTripleHop', deltaKey: 'lsiTripleHopDelta', label: 'LSI Triple Hop Test', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'aclrsi', label: 'Score ACL-RSI Psicometrico', unit: 'pts', dotColor: 'bg-cyan-400' }
        ];
      case 'FORZA':
        return [
          { key: 'quadSano', label: 'Iso Push Leg Ext (SX)', unit: 'N', dotColor: 'bg-[#06B6D4]', getValue: (t) => t.quadSano !== undefined ? t.quadSano : 393 },
          { key: 'quadOp', label: 'Iso Push Leg Ext (DX)', unit: 'N', dotColor: 'bg-pink-400', getValue: (t) => t.quadOp !== undefined ? t.quadOp : 543 },
          { key: 'flexSano', label: 'Iso Push Leg Curl (SX)', unit: 'N', dotColor: 'bg-[#06B6D4]', getValue: (t) => t.flexSano !== undefined ? t.flexSano : 185 },
          { key: 'flexOp', label: 'Iso Push Leg Curl (DX)', unit: 'N', dotColor: 'bg-pink-400', getValue: (t) => t.flexOp !== undefined ? t.flexOp : 245 },
          { key: 'bulgarianSX', label: 'Bulgarian 6RM (SX)', unit: 'kg', dotColor: 'bg-[#06B6D4]', getValue: (t) => t.bulgarianSX !== undefined ? t.bulgarianSX : 38 },
          { key: 'bulgarianDX', label: 'Bulgarian 6RM (DX)', unit: 'kg', dotColor: 'bg-pink-400', getValue: (t) => t.bulgarianDX !== undefined ? t.bulgarianDX : '-' },
          { key: 'soleoSX', label: 'Soleo (SX)', unit: 'kg', dotColor: 'bg-[#06B6D4]', getValue: (t) => t.soleoSX !== undefined ? t.soleoSX : '-' },
          { key: 'soleoDX', label: 'Soleo (DX)', unit: 'kg', dotColor: 'bg-pink-400', getValue: (t) => t.soleoDX !== undefined ? t.soleoDX : '-' },
          { key: 'imtpForce', label: 'IMTP Peak Force', unit: 'N', dotColor: 'bg-amber-400', getValue: (t) => t.imtpForce || '-' },
          { key: 'imtpRelForce', label: 'IMTP Peak Force / BW', unit: 'N/kg', dotColor: 'bg-amber-400', getValue: (t) => t.imtpRelForce || '-' }
        ];

      // 1. TAB [CMJ Bilaterale]
      case 'CMJ_BILATERAL':
        return [
          { 
            key: 'jumpHeight', 
            label: 'Altezza Salto', 
            unit: 'cm', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => {
              const v = t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto ?? t?.jump_height;
              return v !== undefined && v !== null && v !== '' ? `${v} cm` : 'N/D';
            } 
          },
          { 
            key: 'rsiCmj', 
            label: 'RSImod', 
            unit: 'm/s', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => {
              const rsi = t?.rsiCmj ?? t?.rsi_cmj ?? t?.rsi_mod ?? t?.rsi;
              if (rsi !== undefined && rsi !== null && rsi !== '') return `${rsi} m/s`;
              const jh = safeNum(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto, null);
              const ct = safeNum(t?.contractionTime ?? t?.contraction_time_ms ?? t?.tempo_contrazione, null);
              if (jh !== null && ct !== null && ct > 0) {
                return `${((jh / 100) / (ct / 1000)).toFixed(2)} m/s`;
              }
              return 'N/D';
            } 
          },
          { 
            key: 'peakPower', 
            label: 'Peak Power / BM', 
            unit: 'W/kg', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => {
              const v = t?.peakPower ?? t?.peak_power_w ?? t?.peak_power_bm ?? t?.potenza_picco;
              return v !== undefined && v !== null && v !== '' ? `${v} W/kg` : 'N/D';
            } 
          },
          { 
            key: 'cmjDepth', 
            label: 'Countermovement Depth', 
            unit: 'cm', 
            dotColor: 'bg-cyan-400', 
            getValue: (t) => {
              const v = t?.cmjDepth ?? t?.cmj_depth ?? t?.countermovement_depth;
              return v !== undefined && v !== null && v !== '' ? `${v} cm` : 'N/D';
            } 
          },
          { 
            key: 'contractionTime', 
            label: 'Contraction Time', 
            unit: 'ms', 
            dotColor: 'bg-amber-400', 
            getValue: (t) => {
              const v = t?.contractionTime ?? t?.contraction_time_ms ?? t?.tempo_contrazione;
              return v !== undefined && v !== null && v !== '' ? `${v} ms` : 'N/D';
            } 
          },
          { 
            key: 'eccBrakingRfd', 
            label: 'Eccentric Braking RFD', 
            unit: 'N/s', 
            dotColor: 'bg-purple-400', 
            getValue: (t) => {
              const v = t?.eccBrakingRfd ?? t?.ecc_braking_rfd ?? t?.eccentric_braking_rfd;
              return v !== undefined && v !== null && v !== '' ? `${v} N/s` : 'N/D';
            } 
          },
          { 
            key: 'concImpulseSplit', 
            label: 'Concentric Impulse (SX / DX)', 
            unit: 'N·s', 
            dotColor: 'bg-cyan-400', 
            getValue: (t) => {
              const sx = t?.concImpulseSX ?? t?.conc_impulse_sx;
              const dx = t?.concImpulseDX ?? t?.conc_impulse_dx;
              return (sx !== undefined && sx !== null && dx !== undefined && dx !== null) ? `${sx} / ${dx}` : 'N/D';
            },
            getTooltip: (t) => {
              const sx = t?.concImpulseSX ?? t?.conc_impulse_sx;
              const dx = t?.concImpulseDX ?? t?.conc_impulse_dx;
              const lsi = calcRatioLsi(sx, dx);
              return (sx !== undefined && sx !== null && dx !== undefined && dx !== null) ? ({ title: 'Concentric Impulse (SX vs DX)', sx: `${sx} N·s`, dx: `${dx} N·s`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          }
        ];

      // 2. TAB [CMJ Monopodalico]
      case 'CMJ_SL':
        return [
          { 
            key: 'slCmjHeightSplit', 
            label: 'Altezza Salto (SX / DX)', 
            unit: 'cm', 
            dotColor: 'bg-cyan-400',
            getValue: (t) => (t.slCmjHeightSX !== undefined && t.slCmjHeightSX !== null && t.slCmjHeightDX !== undefined && t.slCmjHeightDX !== null) ? `${t.slCmjHeightSX} / ${t.slCmjHeightDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slCmjHeightSX, t.slCmjHeightDX);
              return (t.slCmjHeightSX && t.slCmjHeightDX) ? ({ title: 'Altezza Salto SL (SX vs DX)', sx: `${t.slCmjHeightSX} cm`, dx: `${t.slCmjHeightDX} cm`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          },
          { 
            key: 'slCmjPeakPowerSplit', 
            label: 'Peak Power / BM (SX / DX)', 
            unit: 'W/kg', 
            dotColor: 'bg-[#06B6D4]',
            getValue: (t) => (t.slCmjPeakPowerSX !== undefined && t.slCmjPeakPowerSX !== null && t.slCmjPeakPowerDX !== undefined && t.slCmjPeakPowerDX !== null) ? `${t.slCmjPeakPowerSX} / ${t.slCmjPeakPowerDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slCmjPeakPowerSX, t.slCmjPeakPowerDX);
              return (t.slCmjPeakPowerSX && t.slCmjPeakPowerDX) ? ({ title: 'Peak Power / BM SL (SX vs DX)', sx: `${t.slCmjPeakPowerSX} W/kg`, dx: `${t.slCmjPeakPowerDX} W/kg`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          },
          { 
            key: 'slCmjRsiSplit', 
            label: 'RSImod (SX / DX)', 
            unit: 'm/s', 
            dotColor: 'bg-emerald-400',
            getValue: (t) => (t.slCmjRsiSX !== undefined && t.slCmjRsiSX !== null && t.slCmjRsiDX !== undefined && t.slCmjRsiDX !== null) ? `${t.slCmjRsiSX} / ${t.slCmjRsiDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slCmjRsiSX, t.slCmjRsiDX);
              return (t.slCmjRsiSX && t.slCmjRsiDX) ? ({ title: 'RSImod Monopodalico (SX vs DX)', sx: `${t.slCmjRsiSX} m/s`, dx: `${t.slCmjRsiDX} m/s`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          },
          { 
            key: 'slCmjDepthSplit', 
            label: 'Countermovement Depth (SX / DX)', 
            unit: 'cm', 
            dotColor: 'bg-purple-400',
            getValue: (t) => (t.slCmjDepthSX !== undefined && t.slCmjDepthSX !== null && t.slCmjDepthDX !== undefined && t.slCmjDepthDX !== null) ? `${t.slCmjDepthSX} / ${t.slCmjDepthDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slCmjDepthSX, t.slCmjDepthDX);
              return (t.slCmjDepthSX && t.slCmjDepthDX) ? ({ title: 'Countermovement Depth SL (SX vs DX)', sx: `${t.slCmjDepthSX} cm`, dx: `${t.slCmjDepthDX} cm`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          }
        ];

      // 3. TAB [Drop Jump Bilaterale - RTP Specialist Metriche Temporali & Dual Load Cells]
      case 'DJ_BILATERAL':
        return [
          { 
            key: 'djBoxHeight', 
            label: 'Altezza Caduta Box Selector', 
            unit: '-', 
            dotColor: 'bg-amber-400', 
            getValue: (t) => t.djBoxHeight || '30 cm' 
          },
          { 
            key: 'djJumpHeight', 
            label: 'Altezza Salto (cm)', 
            unit: 'cm', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.djJumpHeight !== undefined && t.djJumpHeight !== null ? `${t.djJumpHeight} cm` : (t.jumpHeight !== undefined ? `${t.jumpHeight} cm` : 'N/D') 
          },
          { 
            key: 'djContactTime', 
            label: 'Ground Contact Time GCT (<250ms)', 
            unit: 'ms', 
            dotColor: 'bg-amber-400', 
            getValue: (t) => t.djContactTime !== undefined && t.djContactTime !== null ? `${t.djContactTime} ms` : 'N/D' 
          },
          { 
            key: 'rsiDropJump', 
            label: '1. Efficienza Pliometrica RSI (>2.0)', 
            unit: 'idx', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.rsiDropJump !== undefined && t.rsiDropJump !== null ? `${t.rsiDropJump} idx` : 'N/D' 
          },
          { 
            key: 'djTtpfMs', 
            label: '2. Time to Peak Force TTPF (80-120ms)', 
            unit: 'ms', 
            dotColor: 'bg-cyan-400', 
            getValue: (t) => t.djTtpfMs !== undefined && t.djTtpfMs !== null ? `${t.djTtpfMs} ms` : 'N/D' 
          },
          { 
            key: 'djTakeoffAsymMs', 
            label: '3. Asimmetria Temporale Stacco (<10ms)', 
            unit: 'ms', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.djTakeoffAsymMs !== undefined && t.djTakeoffAsymMs !== null ? `${t.djTakeoffAsymMs} ms` : 'N/D' 
          },
          { 
            key: 'djLandingPeakLsi', 
            label: 'Landing Peak Force LSI (>=90%)', 
            unit: '%', 
            dotColor: 'bg-pink-400', 
            getValue: (t) => t.djLandingPeakLsi !== undefined && t.djLandingPeakLsi !== null ? `${t.djLandingPeakLsi}%` : (calcRatioLsi(t.djLandingPeakSX, t.djLandingPeakDX) ? `${calcRatioLsi(t.djLandingPeakSX, t.djLandingPeakDX)}%` : 'N/D') 
          },
          { 
            key: 'djConcImpulseLsi', 
            label: 'Concentric Impulse LSI (>=95%)', 
            unit: '%', 
            dotColor: 'bg-cyan-400', 
            getValue: (t) => t.djConcImpulseLsi !== undefined && t.djConcImpulseLsi !== null ? `${t.djConcImpulseLsi}%` : (calcRatioLsi(t.djConcImpulseSX, t.djConcImpulseDX) ? `${calcRatioLsi(t.djConcImpulseSX, t.djConcImpulseDX)}%` : 'N/D') 
          },
          { 
            key: 'djValidationStatus', 
            label: 'Stato Validazione Test RTP Specialist', 
            unit: '-', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.djValidationStatus ? (t.djValidationStatus === 'PASSED' ? '✅ PASSED' : `❌ ${t.djFailReason || 'FAILED'}`) : 'N/D' 
          }
        ];

      // 4. TAB [Drop Jump Monopodalico / SL DJ]
      case 'DJ_SL':
        return [
          { key: 'slDjBoxHeight', label: 'Altezza Caduta Box Selector', unit: 'cm', dotColor: 'bg-amber-400', getValue: (t) => t.slDjBoxHeight || '-' },
          { 
            key: 'slDjCtSplit', 
            label: 'Ground Contact Time (SX / DX)', 
            unit: 'ms', 
            dotColor: 'bg-amber-400',
            getValue: (t) => (t.slDjCtSX !== undefined && t.slDjCtDX !== undefined) ? `${t.slDjCtSX} / ${t.slDjCtDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slDjCtSX, t.slDjCtDX);
              return (t.slDjCtSX !== undefined && t.slDjCtDX !== undefined) ? ({ title: 'Ground Contact Time (SX vs DX)', sx: `${t.slDjCtSX} ms`, dx: `${t.slDjCtDX} ms`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          },
          { 
            key: 'slDjRsiSplit', 
            label: 'RSI (SX / DX)', 
            unit: 'm/s', 
            dotColor: 'bg-emerald-400',
            getValue: (t) => (t.slDjRsiSX !== undefined && t.slDjRsiDX !== undefined) ? `${t.slDjRsiSX} / ${t.slDjRsiDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slDjRsiSX, t.slDjRsiDX);
              return (t.slDjRsiSX !== undefined && t.slDjRsiDX !== undefined) ? ({ title: 'SL Drop Jump RSI (SX vs DX)', sx: `${t.slDjRsiSX} m/s`, dx: `${t.slDjRsiDX} m/s`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          },
          { 
            key: 'slDjHeightSplit', 
            label: 'Altezza Salto (SX / DX)', 
            unit: 'cm', 
            dotColor: 'bg-[#06B6D4]',
            getValue: (t) => (t.slDjHeightSX !== undefined && t.slDjHeightDX !== undefined) ? `${t.slDjHeightSX} / ${t.slDjHeightDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slDjHeightSX, t.slDjHeightDX);
              return (t.slDjHeightSX !== undefined && t.slDjHeightDX !== undefined) ? ({ title: 'SL Drop Jump Altezza (SX vs DX)', sx: `${t.slDjHeightSX} cm`, dx: `${t.slDjHeightDX} cm`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          },
          { 
            key: 'slDjBrakingSplit', 
            label: 'Braking Impulse (SX / DX)', 
            unit: 'N·s', 
            dotColor: 'bg-purple-400',
            getValue: (t) => (t.slDjBrakingSX !== undefined && t.slDjBrakingDX !== undefined) ? `${t.slDjBrakingSX} / ${t.slDjBrakingDX}` : 'N/D',
            getTooltip: (t) => {
              const lsi = calcRatioLsi(t.slDjBrakingSX, t.slDjBrakingDX);
              return (t.slDjBrakingSX !== undefined && t.slDjBrakingDX !== undefined) ? ({ title: 'SL Drop Jump Braking Impulse', sx: `${t.slDjBrakingSX} N·s`, dx: `${t.slDjBrakingDX} N·s`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/D' }) : null;
            }
          }
        ];
      default:
        return [];
    }
  };

  const rows = getSubTabRows();

  // Helper calcolo variazione percentuale % rispetto al test precedente
  const getDeltaText = (row, currTest, tIdx) => {
    if (row.deltaKey && currTest[row.deltaKey]) return currTest[row.deltaKey];
    if (tIdx === 0) return null;
    const prevTest = testsHistory[tIdx - 1];
    const currVal = row.getRawValue ? row.getRawValue(currTest) : currTest[row.key];
    const prevVal = row.getRawValue ? row.getRawValue(prevTest) : prevTest[row.key];
    const currNum = parseFloat(currVal);
    const prevNum = parseFloat(prevVal);
    if (isNaN(currNum) || isNaN(prevNum) || prevNum === 0) return null;
    const diffPct = (((currNum - prevNum) / Math.abs(prevNum)) * 100).toFixed(1);
    return diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`;
  };

  // Checklist appropriata per la fase selezionata (Nomenclatura Sintetica 2-3 Parole)
  const currentChecklistItems = currentPhase.isPhase4 ? [
    { id: 'slDropJumpBox30', label: 'SL Drop Jump OK' },
    { id: 'firstFieldTech', label: 'Primi Gesti Campo' },
    { id: 'weeklyLoadTolerance', label: 'Tolleranza Carichi' }
  ] : currentPhase.isPhase3 ? [
    { id: 'runningCurriculum', label: 'Running 10min OK' },
    { id: 'treadmillMechanics', label: 'Corsa Treadmill' },
    { id: 'noEffusionPostLoad', label: 'No Dolore 24h' }
  ] : [
    { id: 'extensionComplete', label: 'Estensione 0° OK' },
    { id: 'noEffusion', label: 'Assenza Gonfiore' },
    { id: 'singleLegSquat', label: 'Single Leg Squat' },
    { id: 'pogoJump', label: 'Pogo Jump SL' },
    { id: 'landingStrategies', label: 'Landing OK' }
  ];

  const currentChecklistState = currentPhase.isPhase4 ? phase4Checklist : currentPhase.isPhase3 ? phase3Checklist : phase2Checklist;
  const setCurrentChecklistState = currentPhase.isPhase4 ? setPhase4Checklist : currentPhase.isPhase3 ? setPhase3Checklist : setPhase2Checklist;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none w-full items-start">
      
      {/* ========================================================================= */}
      {/* SEZIONE SINISTRA: TABELLA LONGITUDINALE (COL 8/12 - 70% LARGHEZZA) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 bg-[#1E293B] p-4 sm:p-5 rounded-3xl border border-[#334155] space-y-3 shadow-lg w-full flex flex-col justify-between">
        
        {/* Header Tabella Pulita */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#334155]">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#0D9488]" />
              <h3 className="font-extrabold text-white text-sm tracking-wide uppercase">
                TABELLA DATI RACCOLTI PER TIPO DI TEST
              </h3>
            </div>
            <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
              Seleziona 1 tipo di test per isolare i dati assoluti e il confronto col test precedente
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeTest && (
              <button
                onClick={() => {
                  setEditingTest(activeTest);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-[#06B6D4] font-extrabold rounded-xl text-xs flex items-center gap-1.5 border border-[#334155] hover:border-[#06B6D4] transition-all cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Modifica {activeTest.label}</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingTest(null);
                setIsModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#0D9488] hover:bg-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm border border-teal-500/40 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Nuova Valutazione</span>
            </button>
          </div>
        </div>

        {/* 6 Pills Sotto-Tab (Tutte le Sezioni di Salto Sincronizzate - FLEX NOWRAP COMPATTO) */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none p-1 bg-[#0F172A] rounded-xl border border-[#334155]">
          {[
            { id: 'LSI', label: '⚡ Simmetrie & LSI (%)' },
            { id: 'FORZA', label: '🔥 Dominio della Forza' },
            { id: 'CMJ_BILATERAL', label: '📈 CMJ Bilaterale' },
            { id: 'CMJ_SL', label: '🦶 CMJ Monopodalico' },
            { id: 'DJ_BILATERAL', label: '📦 Drop Jump Bilaterale' },
            { id: 'DJ_SL', label: '⚡ SL Drop Jump' }
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#1E293B] text-white border border-[#06B6D4] font-extrabold shadow-xs'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TABELLA STORICO LONGITUDINALE MULTI-SEDUTA AD ALTO CONTRASTO */}
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] rounded-2xl border border-[#334155] bg-[#0F172A] shadow-inner w-full scrollbar-thin">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="border-b border-[#334155] text-[10px] font-mono font-extrabold text-[#94A3B8] uppercase tracking-wider bg-[#1E293B]">
                <th className="sticky top-0 left-0 z-40 bg-[#1E293B] border-b border-r border-[#334155] py-2.5 px-3 text-white font-black min-w-[210px] w-[215px]">
                  Parametro Metrica
                </th>

                {testsHistory.map((t) => {
                  const isSelected = t.id === selectedTestId;
                  return (
                    <th 
                      key={t.id}
                      onClick={() => setSelectedTestId(t.id)}
                      className={`sticky top-0 z-30 py-2 px-2 text-center cursor-pointer transition-all border-b border-[#334155] min-w-[95px] w-[100px] ${
                        isSelected 
                          ? 'bg-[#0F172A] text-white font-black border-t-2 border-x border-[#06B6D4]' 
                          : 'bg-[#1E293B] hover:bg-slate-700/60 text-[#94A3B8]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-extrabold text-xs tracking-tight text-white">{t.label}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTestId(t.id);
                            setEditingTest(t);
                            setIsModalOpen(true);
                          }}
                          title={`Modifica ${t.label}`}
                          className="p-1 hover:bg-[#1E293B] rounded transition-colors text-[#94A3B8] hover:text-[#06B6D4]"
                        >
                          <Edit3 className="w-3 h-3 text-[#06B6D4]" />
                        </button>
                      </div>
                      <div className="text-[9.5px] text-[#06B6D4] font-mono font-bold mt-0.5">{t.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#334155] text-xs font-semibold">
              {testsHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#94A3B8] font-medium bg-[#0F172A]">
                    <div className="space-y-2 max-w-sm mx-auto">
                      <Activity className="w-8 h-8 text-[#06B6D4] mx-auto" />
                      <p className="text-sm font-extrabold text-white">Nessuna valutazione registrata per {patient?.nome} {patient?.cognome}</p>
                      <p className="text-xs text-[#94A3B8]">Clicca sul pulsante in alto <strong className="text-[#0D9488] font-bold">"+ Nuova Valutazione"</strong> per inserire i dati del primo test clinico.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                <tr key={row.key} className="hover:bg-[#1E293B]/60 transition-colors">
                  
                  {/* Colonna 1: Parametro Metrica Sticky */}
                  <td className="sticky left-0 z-20 bg-[#1E293B] border-r border-[#334155] py-2 px-2.5 min-w-[210px] w-[215px] font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${row.dotColor || 'bg-[#0D9488]'} shrink-0`}></span>
                      <span className="truncate text-xs font-bold text-white">
                        {row.label}
                        {row.unit && row.unit !== '-' && (
                          <span className="ml-1 text-[#94A3B8] font-normal text-[10px] font-mono">
                            ({row.unit})
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Colonne Test Registrati: Dati Numerici Bianco Puro (#FFFFFF) */}
                  {testsHistory.map((t, tIdx) => {
                    const isSelected = t.id === selectedTestId;
                    const displayVal = row.getValue ? row.getValue(t) : (t[row.key] !== undefined ? t[row.key] : '-');
                    const delta = getDeltaText(row, t, tIdx);
                    const tooltipData = row.getTooltip ? row.getTooltip(t) : null;

                    return (
                      <td 
                        key={t.id}
                        onClick={() => setSelectedTestId(t.id)}
                        className={`relative group py-2 px-2 text-center font-mono cursor-pointer transition-all min-w-[95px] w-[100px] ${
                          isSelected ? 'bg-[#1E293B] font-black border-x border-[#06B6D4]/50' : 'hover:bg-[#1E293B]/40'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-extrabold text-xs text-white tabular-nums">
                            {displayVal}
                          </span>
                          {delta && (
                            <span className={`text-[8.5px] font-black font-mono px-1 py-0.5 rounded ${
                              delta.startsWith('+') ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30' : 'text-rose-300 bg-rose-950/80 border border-rose-500/30'
                            }`}>
                              {delta}
                            </span>
                          )}
                        </div>

                        {/* HOVER TOOLTIP INTERATTIVO */}
                        {tooltipData && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-60 p-3 rounded-2xl bg-[#0F172A] border border-[#334155] shadow-2xl text-[11px] font-sans pointer-events-none text-left">
                            <div className="font-extrabold text-white text-xs border-b border-[#334155] pb-1.5 mb-1.5 flex items-center justify-between">
                              <span>{tooltipData.title}</span>
                              <span className="text-[9px] font-mono text-[#94A3B8]">{t.date}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#94A3B8] py-0.5">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                                Gamba SX:
                              </span>
                              <strong className="text-white font-mono">{tooltipData.sx}</strong>
                            </div>
                            <div className="flex justify-between items-center text-[#94A3B8] py-0.5">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                Gamba DX:
                              </span>
                              <strong className="text-white font-mono">{tooltipData.dx}</strong>
                            </div>
                            <div className="flex justify-between items-center text-white border-t border-[#334155] pt-1.5 mt-1 font-bold">
                              <span>Confronto:</span>
                              <strong className={tooltipData.isRed ? 'text-rose-400 font-mono' : 'text-[#06B6D4] font-mono'}>
                                {tooltipData.asym}
                              </strong>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SEZIONE DESTRA: BARRE TARGET PRESTATIVI & CHECKLIST QUALITATIVA (COL 4/12) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 bg-[#1E293B] p-3.5 rounded-3xl border border-[#334155] space-y-2.5 shadow-lg w-full flex flex-col justify-between">
        
        {/* Header Barre Target */}
        <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#06B6D4]">
              <Trophy className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xs tracking-wide uppercase">
                BARRE TARGET & PROGRESSO
              </h3>
              <p className="text-[10px] text-[#94A3B8] font-medium">
                Ultimo dato valido registrato nel tempo
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#0D9488] text-[#0D9488] text-[9px] font-black uppercase flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
            Persistente
          </span>
        </div>

        {/* Selezione Fase Target (Pillole F1, F2, F3, F4, F5) */}
        <div className="space-y-1.5 bg-[#0F172A] p-2 rounded-xl border border-[#334155]">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-[#94A3B8] uppercase tracking-wider text-[9px]">TARGET FASE:</span>
            <span className="text-[#06B6D4] font-black text-[10.5px]">{selectedPhase}</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-xs font-black">
            {[
              { key: 'Fase 1', label: 'F1' },
              { key: 'Fase 2 (>70%)', label: 'F2' },
              { key: 'Fase 3 (>80%)', label: 'F3' },
              { key: 'Fase 4', label: 'F4' },
              { key: 'Fase 5 (RTS)', label: 'F5' }
            ].map((pObj) => {
              const isActive = selectedPhase === pObj.key;
              return (
                <button
                  key={pObj.key}
                  onClick={() => {
                    setSelectedPhase(pObj.key);
                  }}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-[#0D9488] text-white font-black shadow-xs border border-[#06B6D4]'
                      : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:text-white'
                  }`}
                >
                  {pObj.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BARRE DI PROGRESSO ORIZZONTALI COMPATTE CON TARGET & DATA ULTIMO TEST */}
        <div className="space-y-2 pt-0.5">
          {cupsData.map((cup) => {
            if (cup.earlyNote) {
              return (
                <div key={cup.id} className="p-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-white text-[10.5px] font-medium space-y-1">
                  <div className="font-black text-[11px] text-[#06B6D4] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>{cup.title} - {cup.subtitle}</span>
                  </div>
                  <p className="text-[10.5px] text-[#94A3B8]">{cup.earlyNote}</p>
                </div>
              );
            }

            const isEvaluated = cup.value !== null && cup.value !== undefined;
            const fillPct = isEvaluated ? Math.min(100, Math.max(8, cup.percentageAchieved)) : 0;
            const isTargetOk = cup.isOk;
            const refDate = cup.meta?.testDate;

            return (
              <div 
                key={cup.id}
                className="p-2 px-2.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1.5 hover:border-slate-500 transition-all"
              >
                {/* Riga 1: Nome Metrica + Data Ultimo Test + Target di riferimento */}
                <div className="flex items-center justify-between gap-1 text-[10.5px] font-bold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-white font-extrabold tracking-tight truncate">
                      {cup.title}
                    </span>
                    {isEvaluated && refDate && (
                      <span
                        title={`Valore rilevato in ${cup.meta?.testLabel || 'Test'} del ${refDate}`}
                        className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-[#94A3B8] font-mono text-[8.5px] font-bold shrink-0"
                      >
                        {refDate}
                      </span>
                    )}
                  </div>
                  <span className="text-[#06B6D4] font-mono text-[9.5px] font-bold shrink-0">
                    {cup.targetLabel}
                  </span>
                </div>

                {/* Riga 2: Barra di avanzamento orizzontale a riempimento fluido */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 h-5.5 bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden p-0.5 shadow-inner">
                    {/* Riempimento fluido Teal Muto / Cyan Clinico vs Ambra (senza colori fosforescenti) */}
                    <div 
                      className={`h-full rounded-md relative transition-all duration-700 ease-out ${
                        !isEvaluated
                          ? 'bg-slate-800 shadow-none'
                          : isTargetOk
                          ? 'bg-gradient-to-r from-[#0D9488] to-[#06B6D4]'
                          : 'bg-gradient-to-r from-amber-700 to-amber-500'
                      }`}
                      style={{ width: `${isEvaluated ? fillPct : 100}%` }}
                    />

                    {/* Valore % in Bianco Puro (#FFFFFF) ad alto contrasto */}
                    <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono tabular-nums ${
                      !isEvaluated
                        ? 'text-[#94A3B8]'
                        : 'text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.9)]'
                    }`}>
                      {isEvaluated ? `${cup.displayVal} (${cup.percentageAchieved}%)` : 'Non Valutato (N/D)'}
                    </div>
                  </div>

                  {/* Badge a destra */}
                  <div className="shrink-0">
                    {!isEvaluated ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#1E293B] border border-[#334155] text-[#94A3B8] text-[8.5px] font-black uppercase flex items-center gap-0.5">
                        NON VALUTATO
                      </span>
                    ) : isTargetOk ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-teal-950/90 border border-[#0D9488] text-white text-[8.5px] font-black uppercase flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#06B6D4] shrink-0" />
                        TARGET OK
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/40 text-amber-200 text-[8.5px] font-black uppercase flex items-center gap-0.5">
                        IN CORSO
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* CHECKLIST QUALITATIVA (GRIGLIA VERTICALE ORDINATA 1 COLONNA) */}
        <div className="p-3 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-2 mt-1.5">
          <div className="flex items-center justify-between border-b border-[#334155] pb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="font-black text-white text-[11px] uppercase tracking-wider">
                Checklist Qualitativa ({selectedPhase})
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-white font-black bg-[#1E293B] px-2 py-0.5 rounded-lg border border-[#334155]">
              {Object.values(currentChecklistState).filter(Boolean).length}/{currentChecklistItems.length} OK
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs font-bold">
            {currentChecklistItems.map((item) => {
              const isChecked = currentChecklistState[item.id];
              return (
                <div 
                  key={item.id}
                  onClick={() => setCurrentChecklistState(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`p-2 px-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-[#1E293B] border-[#0D9488] text-white font-black' 
                      : 'bg-[#1E293B]/50 border-[#334155] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-extrabold whitespace-normal leading-snug">
                    {item.label}
                  </span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                    isChecked ? 'bg-[#0D9488] border-[#0D9488] text-white' : 'border-[#334155] bg-[#0F172A]'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SEZIONE 3: GRAFICO MULTIMETRICA INTERATTIVO (A TUTTA LARGHEZZA) */}
      {/* ========================================================================= */}
      <div className="w-full lg:col-span-12 block pt-2">
        <UIErrorBoundary title="Grafico Multimetrico Temporaneamente Non Disponibile">
          <GraficoMultimetrica tests={testsHistory} />
        </UIErrorBoundary>
      </div>

      {/* MODAL NUOVA VALUTAZIONE CLINICA LCA */}
      <ModalNuovaValutazione 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTest(null);
        }}
        patient={patient}
        initialData={editingTest}
        onSaveEvaluation={handleModalSave}
      />

    </div>
  );
}
