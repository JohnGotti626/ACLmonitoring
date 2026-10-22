import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Plus,
  Edit3,
  CheckCircle2,
  Flame,
  Activity,
  ShieldCheck,
  CheckSquare,
  Check,
  Layers,
  CalendarRange
} from 'lucide-react';
import ModalNuovaValutazione from '../ModalNuovaValutazione';
import GraficoMultimetrica from '../GraficoMultimetrica';
import {
  createTestObject,
  mergeTestIntoSession,
  aggregateTestsIntoSessions,
  saveTestToSupabase,
  sortTestsByDate,
  getLastValidMetricWithMeta,
  toStrictNullOrNumber
} from '../../utils/testUtils';
import { UIErrorBoundary } from '../UIErrorBoundary';

const safeFixed = (val, decimals = 1, fallback = 'N/A') => {
  const n = toStrictNullOrNumber(val, false);
  return n === null ? fallback : n.toFixed(decimals);
};

const calcRatioLsi = (val1, val2) => {
  const n1 = toStrictNullOrNumber(val1, false);
  const n2 = toStrictNullOrNumber(val2, false);
  if (n1 === null || n2 === null || n1 <= 0 || n2 <= 0) return null;
  const max = Math.max(n1, n2);
  if (max === 0) return null;
  return ((Math.min(n1, n2) / max) * 100).toFixed(1);
};

export default function TabBatteriaTest({ patient, activePhase, onSaveTest }) {
  // State Modal Rilevazione Modulare Test
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [initialModalModule, setInitialModalModule] = useState('ISO_EXT');

  // Toggle Raggruppamento in Sessione/Report (14 giorni) vs Singole Rilevazioni
  const [groupByReportSession, setGroupByReportSession] = useState(true);

  // Sub-Tab Superiori a Sinistra (Default: CMJ Bilaterale)
  const [activeSubTab, setActiveSubTab] = useState('CMJ_BILATERAL');

  // Mappa la sotto-tab attiva al modulo corrispondente nel modale
  const getDefaultModuleForSubTab = (subTab) => {
    switch (subTab) {
      case 'LSI':
      case 'FORZA':
        return 'ISO_EXT';
      case 'CMJ_BILATERAL':
        return 'CMJ_BILATERAL';
      case 'CMJ_SL':
        return 'CMJ_SL';
      case 'DJ_BILATERAL':
        return 'DJ_BILATERAL';
      case 'DJ_SL':
        return 'DJ_SL';
      default:
        return 'ISO_EXT';
    }
  };

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

  const [selectedPhase, setSelectedPhase] = useState(() =>
    getPhaseKeyForBatteria(patient?.fase_riabilitativa || activePhase)
  );

  React.useEffect(() => {
    const currentActive = patient?.fase_riabilitativa || activePhase;
    if (currentActive) {
      setSelectedPhase(getPhaseKeyForBatteria(currentActive));
    }
  }, [patient?.fase_riabilitativa, activePhase]);

  // CHECKLIST QUALITATIVA FASI 2, 3, 4
  const [phase2Checklist, setPhase2Checklist] = useState({
    extensionComplete: true,
    noEffusion: true,
    singleLegSquat: true,
    pogoJump: false,
    landingStrategies: true
  });

  const [phase3Checklist, setPhase3Checklist] = useState({
    runningCurriculum: true,
    treadmillMechanics: true,
    noEffusionPostLoad: true
  });

  const [phase4Checklist, setPhase4Checklist] = useState({
    slDropJumpBox30: true,
    firstFieldTech: true,
    weeklyLoadTolerance: true
  });

  // STORICO TEST REGISTRATI NEL TEMPO
  const [testsHistory, setTestsHistory] = useState(() => sortTestsByDate(patient?.tests));
  const [selectedTestId, setSelectedTestId] = useState(() => {
    const cleanTests = sortTestsByDate(patient?.tests);
    return cleanTests.length > 0 ? cleanTests[cleanTests.length - 1].id : null;
  });

  React.useEffect(() => {
    const cleanTests = sortTestsByDate(patient?.tests);
    setTestsHistory(cleanTests);
    if (cleanTests.length > 0) {
      setSelectedTestId(cleanTests[cleanTests.length - 1].id);
    } else {
      setSelectedTestId(null);
    }
  }, [patient?.id, patient?.tests]);

  // Elenco sessioni visualizzate: aggregate in Report (finestra 14gg / session_id) oppure singole
  const displayedSessions = useMemo(() => {
    if (groupByReportSession) {
      return aggregateTestsIntoSessions(testsHistory, 14);
    }
    return testsHistory;
  }, [testsHistory, groupByReportSession]);

  const activeTest =
    displayedSessions.find(t => t.id === selectedTestId) ||
    (displayedSessions.length > 0 ? displayedSessions[displayedSessions.length - 1] : null);

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

  // CONFIGURAZIONE BARRE TARGET PRESTATIVI (Titoli completi leggibili, zero date, null filtrati)
  let cupsData = [];

  if (currentPhase.isEarlyStage) {
    cupsData = [
      {
        id: 'early_stage_info',
        title: 'FASE 1: PRE-TEST CLINICO',
        subtitle: 'Recupero ROM & Estensione Completa 0°',
        earlyNote:
          'In questa prima fase il focus è sul recupero del gonfiore, ROM completo e attivazione artrogena. I test di forza e salto ad alto carico iniziano dalla Fase 2.'
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
    const hqRatioVal =
      quadOpVal !== null && flexOpVal !== null && quadOpVal > 0 ? flexOpVal / quadOpVal : null;
    const ikdcVal = ikdcMeta?.value ?? null;

    cupsData = [
      {
        id: 'lsi_quad',
        title: 'LSI QUADRICIPITE (Iso Push Leg Extension)',
        value: lsiQuadVal,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >70%',
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / 70) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= 70 : false
      },
      {
        id: 'quad_rel_op',
        title: 'FORZA RELATIVA QUADRICIPITE OPERATO (Nm/kg)',
        value: quadOpNmKgVal,
        displayVal: quadOpNmKgVal !== null ? `${safeFixed(quadOpNmKgVal, 2)} Nm/kg` : 'Non testato',
        targetLabel: 'Target >2.0 Nm/kg',
        percentageAchieved: quadOpNmKgVal !== null ? Math.round((quadOpNmKgVal / 2.0) * 100) : 0,
        isOk: quadOpNmKgVal !== null ? quadOpNmKgVal >= 2.0 : false
      },
      {
        id: 'lsi_flex',
        title: 'LSI HAMSTRING (Iso Push Leg Curl)',
        value: lsiFlexVal,
        displayVal: lsiFlexVal !== null ? `${safeFixed(lsiFlexVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >70%',
        percentageAchieved: lsiFlexVal !== null ? Math.round((lsiFlexVal / 70) * 100) : 0,
        isOk: lsiFlexVal !== null ? lsiFlexVal >= 70 : false
      },
      {
        id: 'hq_ratio',
        title: 'H/Q RATIO ISOMETRICO (Flessori / Quadricipite)',
        value: hqRatioVal,
        displayVal: hqRatioVal !== null ? `${safeFixed(hqRatioVal, 2)}` : 'Non testato',
        targetLabel: 'Target >0.55',
        percentageAchieved: hqRatioVal !== null ? Math.round((hqRatioVal / 0.55) * 100) : 0,
        isOk: hqRatioVal !== null ? hqRatioVal >= 0.55 : false
      },
      {
        id: 'ikdc_score',
        title: 'SCORE IKDC SOGGETTIVO (Prontitudine Clinica)',
        value: ikdcVal,
        displayVal: ikdcVal !== null ? `${safeFixed(ikdcVal, 1)}/100` : 'Non testato',
        targetLabel: 'Target >64/100',
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
        title: 'LSI QUADRICIPITE (Iso Push Leg Extension)',
        value: lsiQuadVal,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >80%',
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / 80) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= 80 : false
      },
      {
        id: 'lsi_ham_3',
        title: 'LSI HAMSTRING (Iso Push Leg Curl)',
        value: lsiFlexVal,
        displayVal: lsiFlexVal !== null ? `${safeFixed(lsiFlexVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >80%',
        percentageAchieved: lsiFlexVal !== null ? Math.round((lsiFlexVal / 80) * 100) : 0,
        isOk: lsiFlexVal !== null ? lsiFlexVal >= 80 : false
      },
      {
        id: 'cmj_braking_3',
        title: 'LSI BRAKING IMPULSE (Frenata Eccentrica CMJ)',
        value: cmjImpulseLsiVal,
        displayVal: cmjImpulseLsiVal !== null ? `${safeFixed(cmjImpulseLsiVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >80%',
        percentageAchieved: cmjImpulseLsiVal !== null ? Math.round((cmjImpulseLsiVal / 80) * 100) : 0,
        isOk: cmjImpulseLsiVal !== null ? cmjImpulseLsiVal >= 80 : false
      },
      {
        id: 'lsi_height_3',
        title: 'SL CMJ ALTEZZA SALTO LSI (Salto Monopodalico)',
        value: slCmjHeightLsiVal,
        displayVal: slCmjHeightLsiVal !== null ? `${safeFixed(slCmjHeightLsiVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >80%',
        percentageAchieved: slCmjHeightLsiVal !== null ? Math.round((slCmjHeightLsiVal / 80) * 100) : 0,
        isOk: slCmjHeightLsiVal !== null ? slCmjHeightLsiVal >= 80 : false
      },
      {
        id: 'rsi_dj_3',
        title: 'DROP JUMP BILATERALE RSI (Indice Reattivo)',
        value: rsiDropJumpVal,
        displayVal: rsiDropJumpVal !== null ? `${safeFixed(rsiDropJumpVal, 2)} idx` : 'Non testato',
        targetLabel: 'Target >1.20 idx',
        percentageAchieved: rsiDropJumpVal !== null ? Math.round((rsiDropJumpVal / 1.2) * 100) : 0,
        isOk: rsiDropJumpVal !== null ? rsiDropJumpVal >= 1.2 : false
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
        title: 'LSI QUADRICIPITE (Iso Push Leg Extension)',
        value: lsiQuadVal,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >85%',
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / 85) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= 85 : false
      },
      {
        id: 'lsi_ham_p4',
        title: 'LSI HAMSTRING (Iso Push Leg Curl)',
        value: lsiFlexVal,
        displayVal: lsiFlexVal !== null ? `${safeFixed(lsiFlexVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >85%',
        percentageAchieved: lsiFlexVal !== null ? Math.round((lsiFlexVal / 85) * 100) : 0,
        isOk: lsiFlexVal !== null ? lsiFlexVal >= 85 : false
      },
      {
        id: 'cmj_braking_p4',
        title: 'LSI BRAKING IMPULSE (Frenata Eccentrica CMJ)',
        value: cmjAsymLsi,
        displayVal: cmjAsymLsi !== null ? `${safeFixed(cmjAsymLsi, 1)}%` : 'Non testato',
        targetLabel: 'Target >85%',
        percentageAchieved: cmjAsymLsi !== null ? Math.round((cmjAsymLsi / 85) * 100) : 0,
        isOk: cmjAsymLsi !== null ? cmjAsymLsi >= 85 : false
      },
      {
        id: 'sl_cmj_p4',
        title: 'SL CMJ ALTEZZA SALTO LSI (Salto Monopodalico)',
        value: slCmjHeightLsiVal,
        displayVal: slCmjHeightLsiVal !== null ? `${safeFixed(slCmjHeightLsiVal, 1)}%` : 'Non testato',
        targetLabel: 'Target >85%',
        percentageAchieved: slCmjHeightLsiVal !== null ? Math.round((slCmjHeightLsiVal / 85) * 100) : 0,
        isOk: slCmjHeightLsiVal !== null ? slCmjHeightLsiVal >= 85 : false
      },
      {
        id: 'dl_dj_p4',
        title: 'DROP JUMP BILATERALE RSI (Indice Reattivo)',
        value: rsiDropJumpVal,
        displayVal: rsiDropJumpVal !== null ? `${safeFixed(rsiDropJumpVal, 2)} idx` : 'Non testato',
        targetLabel: 'Target >1.30 idx',
        percentageAchieved: rsiDropJumpVal !== null ? Math.round((rsiDropJumpVal / 1.3) * 100) : 0,
        isOk: rsiDropJumpVal !== null ? rsiDropJumpVal >= 1.3 : false
      },
      {
        id: 'aclrsi_p4',
        title: 'SCORE ACL-RSI (Prontitudine Psicologica)',
        value: aclrsiVal,
        displayVal: aclrsiVal !== null ? `${safeFixed(aclrsiVal, 1)}/100` : 'Non testato',
        targetLabel: 'Target >65/100',
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
        title: 'LSI QUADRICIPITE (Iso Push Leg Extension)',
        value: lsiQuadVal,
        displayVal: lsiQuadVal !== null ? `${safeFixed(lsiQuadVal, 1)}%` : 'Non testato',
        targetLabel: `Target >${targetQuadLSI}%`,
        percentageAchieved: lsiQuadVal !== null ? Math.round((lsiQuadVal / targetQuadLSI) * 100) : 0,
        isOk: lsiQuadVal !== null ? lsiQuadVal >= targetQuadLSI : false
      },
      {
        id: 'quad_nm_kg',
        title: 'FORZA RELATIVA QUADRICIPITE OPERATO (Nm/kg)',
        value: quadOpNmKgVal,
        displayVal: quadOpNmKgVal !== null ? `${safeFixed(quadOpNmKgVal, 2)} Nm/kg` : 'Non testato',
        targetLabel: `Target >${targetNmKg} Nm/kg`,
        percentageAchieved: quadOpNmKgVal !== null ? Math.round((quadOpNmKgVal / targetNmKg) * 100) : 0,
        isOk: quadOpNmKgVal !== null ? quadOpNmKgVal >= targetNmKg : false
      },
      {
        id: 'rsi_drop_jump',
        title: 'RSI DROP JUMP BILATERALE (Contact Time <250ms)',
        value: rsiDropJumpVal,
        displayVal: rsiDropJumpVal !== null ? `${safeFixed(rsiDropJumpVal, 2)} rsi` : 'Non testato',
        targetLabel: `Target >${targetRsi} rsi`,
        percentageAchieved: rsiDropJumpVal !== null ? Math.round((rsiDropJumpVal / targetRsi) * 100) : 0,
        isOk: rsiDropJumpVal !== null ? rsiDropJumpVal >= targetRsi : false
      }
    ];
  }

  // Salvataggio o merge in una Sessione / Report esistente (preservando i test precedenti della sessione e mantenendo null i campi non testati)
  const handleModalSave = async (newValData) => {
    const targetId = newValData.id || editingTest?.id;
    const existingMatch = targetId ? testsHistory.find(t => t.id === targetId) : null;

    if (existingMatch) {
      const updated = testsHistory.map((existingTest) => {
        if (existingTest.id === targetId) {
          const mergedSession = mergeTestIntoSession(existingTest, newValData, patient?.id);
          saveTestToSupabase(mergedSession);
          return mergedSession;
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

  // SOTTO-TAB PER TUTTI I DOMINI (Senza alcun numero hardcoded fittizio: se non testato restituisce 'Non testato')
  const getSubTabRows = () => {
    const fmtSingle = (val, unitStr = '') => {
      const n = toStrictNullOrNumber(val, false);
      return n !== null ? `${n}${unitStr ? ` ${unitStr}` : ''}` : 'Non testato';
    };

    const fmtPair = (sxVal, dxVal) => {
      const sx = toStrictNullOrNumber(sxVal, false);
      const dx = toStrictNullOrNumber(dxVal, false);
      if (sx === null && dx === null) return 'Non testato';
      return `${sx ?? 'N/A'} / ${dx ?? 'N/A'}`;
    };

    switch (activeSubTab) {
      case 'LSI':
        return [
          {
            key: 'lsiQuad',
            deltaKey: 'lsiQuadDelta',
            label: 'LSI Quadricipite Iso Push',
            unit: '%',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.lsiQuad ?? t?.lsi_quad_calculated),
            getValue: (t) => fmtSingle(t?.lsiQuad ?? t?.lsi_quad_calculated, '%')
          },
          {
            key: 'lsiFlex',
            deltaKey: 'lsiFlexDelta',
            label: 'LSI Ischiocrurali Leg Curl',
            unit: '%',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.lsiFlex ?? t?.lsi_curl_calculated),
            getValue: (t) => fmtSingle(t?.lsiFlex ?? t?.lsi_curl_calculated, '%')
          },
          {
            key: 'lsiSingleHop',
            label: 'LSI Single Hop Test',
            unit: '%',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.lsiSingleHop ?? t?.lsi_single_hop),
            getValue: (t) => fmtSingle(t?.lsiSingleHop ?? t?.lsi_single_hop, '%')
          },
          {
            key: 'lsiTripleHop',
            label: 'LSI Triple Hop Test',
            unit: '%',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.lsiTripleHop ?? t?.lsi_triple_hop),
            getValue: (t) => fmtSingle(t?.lsiTripleHop ?? t?.lsi_triple_hop, '%')
          },
          {
            key: 'ikdc',
            label: 'Score IKDC Soggettivo',
            unit: '/100',
            dotColor: 'bg-sky-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.ikdc ?? t?.ikdc_score),
            getValue: (t) => fmtSingle(t?.ikdc ?? t?.ikdc_score, 'pts')
          },
          {
            key: 'aclrsi',
            label: 'Score ACL-RSI Psicometrico',
            unit: '/100',
            dotColor: 'bg-cyan-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.aclrsi ?? t?.acl_rsi),
            getValue: (t) => fmtSingle(t?.aclrsi ?? t?.acl_rsi, 'pts')
          }
        ];

      case 'FORZA':
        return [
          {
            key: 'quadSano',
            label: 'Iso Push Leg Ext (SX)',
            unit: 'N',
            dotColor: 'bg-sky-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.quadSano ?? t?.iso_leg_ext_sx),
            getValue: (t) => fmtSingle(t?.quadSano ?? t?.iso_leg_ext_sx, 'N')
          },
          {
            key: 'quadOp',
            label: 'Iso Push Leg Ext (DX)',
            unit: 'N',
            dotColor: 'bg-pink-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.quadOp ?? t?.iso_leg_ext_dx),
            getValue: (t) => fmtSingle(t?.quadOp ?? t?.iso_leg_ext_dx, 'N')
          },
          {
            key: 'flexSano',
            label: 'Iso Push Leg Curl (SX)',
            unit: 'N',
            dotColor: 'bg-sky-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.flexSano ?? t?.iso_leg_curl_sx),
            getValue: (t) => fmtSingle(t?.flexSano ?? t?.iso_leg_curl_sx, 'N')
          },
          {
            key: 'flexOp',
            label: 'Iso Push Leg Curl (DX)',
            unit: 'N',
            dotColor: 'bg-pink-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.flexOp ?? t?.iso_leg_curl_dx),
            getValue: (t) => fmtSingle(t?.flexOp ?? t?.iso_leg_curl_dx, 'N')
          },
          {
            key: 'bulgarianSX',
            label: 'Bulgarian 6RM (SX)',
            unit: 'kg',
            dotColor: 'bg-sky-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.bulgarianSX ?? t?.bulgarian_sx),
            getValue: (t) => fmtSingle(t?.bulgarianSX ?? t?.bulgarian_sx, 'kg')
          },
          {
            key: 'bulgarianDX',
            label: 'Bulgarian 6RM (DX)',
            unit: 'kg',
            dotColor: 'bg-pink-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.bulgarianDX ?? t?.bulgarian_dx),
            getValue: (t) => fmtSingle(t?.bulgarianDX ?? t?.bulgarian_dx, 'kg')
          },
          {
            key: 'soleoSX',
            label: 'Soleo Seduto (SX)',
            unit: 'kg',
            dotColor: 'bg-sky-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.soleoSX ?? t?.soleo_sx),
            getValue: (t) => fmtSingle(t?.soleoSX ?? t?.soleo_sx, 'kg')
          },
          {
            key: 'soleoDX',
            label: 'Soleo Seduto (DX)',
            unit: 'kg',
            dotColor: 'bg-pink-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.soleoDX ?? t?.soleo_dx),
            getValue: (t) => fmtSingle(t?.soleoDX ?? t?.soleo_dx, 'kg')
          },
          {
            key: 'imtpForce',
            label: 'IMTP Peak Force',
            unit: 'N',
            dotColor: 'bg-amber-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.imtpForce ?? t?.imtp_peak_force),
            getValue: (t) => fmtSingle(t?.imtpForce ?? t?.imtp_peak_force, 'N')
          }
        ];

      case 'CMJ_BILATERAL':
        return [
          {
            key: 'jumpHeight',
            label: 'Altezza Salto',
            unit: 'cm',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto),
            getValue: (t) => fmtSingle(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto, 'cm')
          },
          {
            key: 'rsiCmj',
            label: 'RSImod',
            unit: 'm/s',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => {
              const direct = toStrictNullOrNumber(t?.rsiCmj ?? t?.rsi_cmj ?? t?.rsi_mod);
              if (direct !== null) return direct;
              const jh = toStrictNullOrNumber(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto);
              const ct = toStrictNullOrNumber(t?.contractionTime ?? t?.contraction_time_ms ?? t?.tempo_contrazione);
              return jh !== null && ct !== null && ct > 0 ? parseFloat(((jh / 100) / (ct / 1000)).toFixed(2)) : null;
            },
            getValue: (t) => {
              const direct = toStrictNullOrNumber(t?.rsiCmj ?? t?.rsi_cmj ?? t?.rsi_mod);
              if (direct !== null) return `${direct} m/s`;
              const jh = toStrictNullOrNumber(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto);
              const ct = toStrictNullOrNumber(t?.contractionTime ?? t?.contraction_time_ms ?? t?.tempo_contrazione);
              if (jh !== null && ct !== null && ct > 0) {
                return `${((jh / 100) / (ct / 1000)).toFixed(2)} m/s`;
              }
              return 'Non testato';
            }
          },
          {
            key: 'peakPower',
            label: 'Peak Power / BM',
            unit: 'W/kg',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco),
            getValue: (t) => fmtSingle(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco, 'W/kg')
          },
          {
            key: 'cmjDepth',
            label: 'Countermovement Depth',
            unit: 'cm',
            dotColor: 'bg-cyan-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.cmjDepth ?? t?.cmj_depth),
            getValue: (t) => fmtSingle(t?.cmjDepth ?? t?.cmj_depth, 'cm')
          },
          {
            key: 'contractionTime',
            label: 'Contraction Time',
            unit: 'ms',
            dotColor: 'bg-amber-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.contractionTime ?? t?.contraction_time_ms),
            getValue: (t) => fmtSingle(t?.contractionTime ?? t?.contraction_time_ms, 'ms')
          },
          {
            key: 'eccBrakingRfd',
            label: 'Eccentric Braking RFD',
            unit: 'N/s',
            dotColor: 'bg-purple-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.eccBrakingRfd ?? t?.ecc_braking_rfd),
            getValue: (t) => fmtSingle(t?.eccBrakingRfd ?? t?.ecc_braking_rfd, 'N/s')
          },
          {
            key: 'concImpulseSplit',
            label: 'Concentric Impulse (SX / DX)',
            unit: 'N·s',
            dotColor: 'bg-cyan-400',
            getValue: (t) => fmtPair(t?.concImpulseSX ?? t?.conc_impulse_sx, t?.concImpulseDX ?? t?.conc_impulse_dx),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.concImpulseSX ?? t?.conc_impulse_sx);
              const dx = toStrictNullOrNumber(t?.concImpulseDX ?? t?.conc_impulse_dx);
              const lsi = calcRatioLsi(sx, dx);
              return sx !== null && dx !== null
                ? {
                    title: 'Concentric Impulse (SX vs DX)',
                    sx: `${sx} N·s`,
                    dx: `${dx} N·s`,
                    asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A'
                  }
                : null;
            }
          }
        ];

      case 'CMJ_SL':
        return [
          {
            key: 'slCmjHeightSplit',
            label: 'Altezza Salto (SX / DX)',
            unit: 'cm',
            dotColor: 'bg-cyan-400',
            getValue: (t) => fmtPair(t?.slCmjHeightSX, t?.slCmjHeightDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjHeightSX);
              const dx = toStrictNullOrNumber(t?.slCmjHeightDX);
              const lsi = calcRatioLsi(sx, dx);
              return sx !== null && dx !== null
                ? { title: 'Altezza Salto SL (SX vs DX)', sx: `${sx} cm`, dx: `${dx} cm`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          },
          {
            key: 'slCmjPeakPowerSplit',
            label: 'Peak Power / BM (SX / DX)',
            unit: 'W/kg',
            dotColor: 'bg-sky-400',
            getValue: (t) => fmtPair(t?.slCmjPeakPowerSX, t?.slCmjPeakPowerDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjPeakPowerSX);
              const dx = toStrictNullOrNumber(t?.slCmjPeakPowerDX);
              const lsi = calcRatioLsi(sx, dx);
              return sx !== null && dx !== null
                ? { title: 'Peak Power / BM SL (SX vs DX)', sx: `${sx} W/kg`, dx: `${dx} W/kg`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          },
          {
            key: 'slCmjRsiSplit',
            label: 'RSImod (SX / DX)',
            unit: 'm/s',
            dotColor: 'bg-emerald-400',
            getValue: (t) => fmtPair(t?.slCmjRsiSX, t?.slCmjRsiDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjRsiSX);
              const dx = toStrictNullOrNumber(t?.slCmjRsiDX);
              const lsi = calcRatioLsi(sx, dx);
              return sx !== null && dx !== null
                ? { title: 'RSImod Monopodalico (SX vs DX)', sx: `${sx} m/s`, dx: `${dx} m/s`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          },
          {
            key: 'slCmjDepthSplit',
            label: 'Countermovement Depth (SX / DX)',
            unit: 'cm',
            dotColor: 'bg-purple-400',
            getValue: (t) => fmtPair(t?.slCmjDepthSX, t?.slCmjDepthDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjDepthSX);
              const dx = toStrictNullOrNumber(t?.slCmjDepthDX);
              const lsi = calcRatioLsi(sx, dx);
              return sx !== null && dx !== null
                ? { title: 'Countermovement Depth SL (SX vs DX)', sx: `${sx} cm`, dx: `${dx} cm`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          }
        ];

      case 'DJ_BILATERAL':
        return [
          {
            key: 'djBoxHeight',
            label: 'Altezza Caduta Box',
            unit: '-',
            dotColor: 'bg-amber-400',
            getValue: (t) => {
              const hasAnyDj =
                toStrictNullOrNumber(t?.djJumpHeight) !== null ||
                toStrictNullOrNumber(t?.djContactTime) !== null ||
                toStrictNullOrNumber(t?.rsiDropJump) !== null;
              return hasAnyDj ? (t?.djBoxHeight || '30 cm') : 'Non testato';
            }
          },
          {
            key: 'djJumpHeight',
            label: 'Altezza Salto (cm)',
            unit: 'cm',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.djJumpHeight),
            getValue: (t) => fmtSingle(t?.djJumpHeight, 'cm')
          },
          {
            key: 'djContactTime',
            label: 'Ground Contact Time GCT (<250ms)',
            unit: 'ms',
            dotColor: 'bg-amber-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.djContactTime),
            getValue: (t) => fmtSingle(t?.djContactTime, 'ms')
          },
          {
            key: 'rsiDropJump',
            label: '1. Efficienza Pliometrica RSI (>2.0)',
            unit: 'idx',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.rsiDropJump ?? t?.djRSI ?? t?.dj_rsi),
            getValue: (t) => fmtSingle(t?.rsiDropJump ?? t?.djRSI ?? t?.dj_rsi, 'idx')
          },
          {
            key: 'djTtpfMs',
            label: '2. Time to Peak Force TTPF (80-120ms)',
            unit: 'ms',
            dotColor: 'bg-cyan-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.djTtpfMs),
            getValue: (t) => fmtSingle(t?.djTtpfMs, 'ms')
          },
          {
            key: 'djTakeoffAsymMs',
            label: '3. Asimmetria Temporale Stacco (<10ms)',
            unit: 'ms',
            dotColor: 'bg-emerald-400',
            getRawValue: (t) => toStrictNullOrNumber(t?.djTakeoffAsymMs, true),
            getValue: (t) => {
              const v = toStrictNullOrNumber(t?.djTakeoffAsymMs, true);
              return v !== null ? `${v} ms` : 'Non testato';
            }
          },
          {
            key: 'djLandingPeakLsi',
            label: 'Landing Peak Force LSI (>=90%)',
            unit: '%',
            dotColor: 'bg-pink-400',
            getRawValue: (t) => {
              const direct = toStrictNullOrNumber(t?.djLandingPeakLsi);
              if (direct !== null) return direct;
              const calc = calcRatioLsi(t?.djLandingPeakSX, t?.djLandingPeakDX);
              return calc !== null ? parseFloat(calc) : null;
            },
            getValue: (t) => {
              const direct = toStrictNullOrNumber(t?.djLandingPeakLsi);
              if (direct !== null) return `${direct}%`;
              const calc = calcRatioLsi(t?.djLandingPeakSX, t?.djLandingPeakDX);
              return calc !== null ? `${calc}%` : 'Non testato';
            }
          },
          {
            key: 'djConcImpulseLsi',
            label: 'Concentric Impulse LSI (>=95%)',
            unit: '%',
            dotColor: 'bg-cyan-400',
            getRawValue: (t) => {
              const direct = toStrictNullOrNumber(t?.djConcImpulseLsi);
              if (direct !== null) return direct;
              const calc = calcRatioLsi(t?.djConcImpulseSX, t?.djConcImpulseDX);
              return calc !== null ? parseFloat(calc) : null;
            },
            getValue: (t) => {
              const direct = toStrictNullOrNumber(t?.djConcImpulseLsi);
              if (direct !== null) return `${direct}%`;
              const calc = calcRatioLsi(t?.djConcImpulseSX, t?.djConcImpulseDX);
              return calc !== null ? `${calc}%` : 'Non testato';
            }
          }
        ];

      case 'DJ_SL':
        return [
          {
            key: 'slDjBoxHeight',
            label: 'Altezza Caduta Box',
            unit: 'cm',
            dotColor: 'bg-amber-400',
            getValue: (t) => {
              const hasAnySlDj =
                toStrictNullOrNumber(t?.slDjCtSX) !== null ||
                toStrictNullOrNumber(t?.slDjRsiSX) !== null ||
                toStrictNullOrNumber(t?.slDjHeightSX) !== null;
              return hasAnySlDj ? (t?.slDjBoxHeight || '30 cm') : 'Non testato';
            }
          },
          {
            key: 'slDjCtSplit',
            label: 'Ground Contact Time (SX / DX)',
            unit: 'ms',
            dotColor: 'bg-amber-400',
            getValue: (t) => fmtPair(t?.slDjCtSX, t?.slDjCtDX)
          },
          {
            key: 'slDjRsiSplit',
            label: 'RSI (SX / DX)',
            unit: 'm/s',
            dotColor: 'bg-emerald-400',
            getValue: (t) => fmtPair(t?.slDjRsiSX, t?.slDjRsiDX)
          },
          {
            key: 'slDjHeightSplit',
            label: 'Altezza Salto (SX / DX)',
            unit: 'cm',
            dotColor: 'bg-sky-400',
            getValue: (t) => fmtPair(t?.slDjHeightSX, t?.slDjHeightDX)
          },
          {
            key: 'slDjBrakingSplit',
            label: 'Braking Impulse (SX / DX)',
            unit: 'N·s',
            dotColor: 'bg-purple-400',
            getValue: (t) => fmtPair(t?.slDjBrakingSX, t?.slDjBrakingDX)
          }
        ];

      default:
        return [];
    }
  };

  const rows = getSubTabRows();

  // Calcolo variazione percentuale % ignorando rigorosamente i test intermedi in cui la metrica è null / Non testata
  const getDeltaText = (row, currTest, tIdx) => {
    const currVal = row.getRawValue ? row.getRawValue(currTest) : toStrictNullOrNumber(currTest?.[row.key]);
    if (currVal === null || tIdx === 0) return null;

    // Cerca a ritroso la sessione precedente più recente in cui questa metrica era stata effettivamente rilevata
    for (let p = tIdx - 1; p >= 0; p--) {
      const prevSession = displayedSessions[p];
      const prevVal = row.getRawValue ? row.getRawValue(prevSession) : toStrictNullOrNumber(prevSession?.[row.key]);
      if (prevVal !== null && prevVal > 0) {
        const diffPct = (((currVal - prevVal) / Math.abs(prevVal)) * 100).toFixed(1);
        return Number(diffPct) >= 0 ? `+${diffPct}%` : `${diffPct}%`;
      }
    }
    return null;
  };

  const currentChecklistItems = currentPhase.isPhase4
    ? [
        { id: 'slDropJumpBox30', label: 'SL Drop Jump OK' },
        { id: 'firstFieldTech', label: 'Primi Gesti Campo' },
        { id: 'weeklyLoadTolerance', label: 'Tolleranza Carichi' }
      ]
    : currentPhase.isPhase3
    ? [
        { id: 'runningCurriculum', label: 'Running 10min OK' },
        { id: 'treadmillMechanics', label: 'Corsa Treadmill' },
        { id: 'noEffusionPostLoad', label: 'No Dolore 24h' }
      ]
    : [
        { id: 'extensionComplete', label: 'Estensione 0° OK' },
        { id: 'noEffusion', label: 'Assenza Gonfiore' },
        { id: 'singleLegSquat', label: 'Single Leg Squat' },
        { id: 'pogoJump', label: 'Pogo Jump SL' },
        { id: 'landingStrategies', label: 'Landing OK' }
      ];

  const currentChecklistState = currentPhase.isPhase4
    ? phase4Checklist
    : currentPhase.isPhase3
    ? phase3Checklist
    : phase2Checklist;
  const setCurrentChecklistState = currentPhase.isPhase4
    ? setPhase4Checklist
    : currentPhase.isPhase3
    ? setPhase3Checklist
    : setPhase2Checklist;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none w-full items-start">

      {/* ========================================================================= */}
      {/* SEZIONE SINISTRA: TABELLA LONGITUDINALE & SESSIONI REPORT (COL 8/12)      */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 bg-slate-800/80 p-5 sm:p-6 rounded-3xl border border-slate-700/60 space-y-4 shadow-xl backdrop-blur-sm w-full flex flex-col justify-between">

        {/* Header Tabella + Pulsanti Inserimento Modulare e Raggruppamento Report */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3.5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/70 text-emerald-400 shadow-xs">
              <Flame className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base tracking-wide uppercase">
                REPORT &amp; SESSIONI DI VALUTAZIONE CLINICA
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                I test effettuati in giorni diversi (7-14 gg) confluiscono nel Report di Sessione; i test assenti sono ignorati (<code className="text-slate-300">Non testato</code>)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
            {/* Toggle Raggruppamento Report 14gg vs Singole Date */}
            <button
              type="button"
              onClick={() => setGroupByReportSession(prev => !prev)}
              title="Unisce automaticamente i singoli test eseguiti nell'arco di 7-14 giorni in un unico Report di Valutazione"
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                groupByReportSession
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>{groupByReportSession ? 'Report Aggregato (7-14gg)' : 'Singole Rilevazioni'}</span>
            </button>

            {activeTest && (
              <button
                type="button"
                onClick={() => {
                  setEditingTest(activeTest);
                  setInitialModalModule(getDefaultModuleForSubTab(activeSubTab));
                  setIsModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-600/80 hover:border-slate-400 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Aggiungi / Modifica in {activeTest.session_name || activeTest.label}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingTest(null);
                setInitialModalModule(getDefaultModuleForSubTab(activeSubTab));
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md border border-emerald-400/40 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Rileva Singolo Test</span>
            </button>
          </div>
        </div>

        {/* 6 Pills Sotto-Tab per Dominio */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none p-1.5 bg-slate-900/90 rounded-2xl border border-slate-700/60">
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
                className={`px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-700 text-white border border-slate-500 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 font-medium border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TABELLA STORICO LONGITUDINALE MULTI-SESSIONE */}
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] rounded-2xl border border-slate-700/70 bg-slate-900 shadow-inner w-full scrollbar-thin">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-700/80 text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider bg-slate-800">
                <th className="sticky top-0 left-0 z-40 bg-slate-800 border-b-2 border-r border-slate-700/80 py-3.5 px-4 text-slate-100 font-bold min-w-[230px] w-[240px]">
                  Parametro Metrica
                </th>

                {displayedSessions.map((t) => {
                  const isSelected = t.id === selectedTestId;
                  return (
                    <th
                      key={t.id}
                      onClick={() => setSelectedTestId(t.id)}
                      className={`sticky top-0 z-30 py-3 px-3.5 text-center cursor-pointer transition-all border-b-2 border-r border-slate-700/60 min-w-[135px] ${
                        isSelected
                          ? 'bg-slate-900 text-white font-bold border-t-2 border-t-emerald-400 shadow-inner'
                          : 'bg-slate-800 hover:bg-slate-700/70 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-xs tracking-tight text-slate-100">
                          {t.session_name || t.label}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTestId(t.id);
                            setEditingTest(t);
                            setInitialModalModule(getDefaultModuleForSubTab(activeSubTab));
                            setIsModalOpen(true);
                          }}
                          title={`Aggiungi o modifica test in ${t.session_name || t.label}`}
                          className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-amber-400"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">
                        {t.dateRange || t.date}
                      </div>
                      {t.aggregatedCount > 1 && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-[9px] text-sky-300 font-sans font-bold">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{t.aggregatedCount} rilevazioni</span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/50 text-xs">
              {displayedSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400 font-medium bg-slate-900">
                    <div className="space-y-2.5 max-w-sm mx-auto">
                      <Activity className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-100">
                        Nessun test registrato per {patient?.nome} {patient?.cognome}
                      </p>
                      <p className="text-xs text-slate-400">
                        Clicca su <strong className="text-emerald-400 font-bold">&quot;+ Rileva Singolo Test&quot;</strong> per scegliere quale test clinico inserire.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIdx) => (
                  <tr
                    key={row.key}
                    className={`transition-colors border-b border-slate-700/50 ${
                      rowIdx % 2 === 0 ? 'bg-slate-900/80' : 'bg-slate-800/45'
                    } hover:bg-slate-700/45`}
                  >
                    {/* Colonna 1: Parametro Metrica */}
                    <td
                      className={`sticky left-0 z-20 border-r border-slate-700/70 py-3.5 px-4 min-w-[230px] w-[240px] ${
                        rowIdx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${row.dotColor || 'bg-emerald-400'} shrink-0 shadow-xs`} />
                        <span className="text-[13px] font-semibold text-slate-100 leading-snug">
                          {row.label}
                          {row.unit && row.unit !== '-' && (
                            <span className="ml-1.5 text-slate-400 font-normal text-[11px] font-mono">
                              ({row.unit})
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Colonne Sessioni Registrate */}
                    {displayedSessions.map((t, tIdx) => {
                      const isSelected = t.id === selectedTestId;
                      const displayVal = row.getValue
                        ? row.getValue(t)
                        : toStrictNullOrNumber(t[row.key]) !== null
                        ? String(t[row.key])
                        : 'Non testato';
                      const isUntested =
                        displayVal === 'Non testato' || displayVal === 'N/A' || displayVal === 'N/D' || displayVal === '-';
                      const delta = !isUntested ? getDeltaText(row, t, tIdx) : null;
                      const tooltipData = !isUntested && row.getTooltip ? row.getTooltip(t) : null;

                      return (
                        <td
                          key={t.id}
                          onClick={() => setSelectedTestId(t.id)}
                          className={`relative group py-3 px-3 text-center font-mono cursor-pointer transition-all border-r border-slate-700/40 min-w-[135px] ${
                            isSelected
                              ? 'bg-slate-800/90 font-bold ring-1 ring-inset ring-emerald-500/30'
                              : 'hover:bg-slate-700/35'
                          }`}
                        >
                          {isUntested ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-800/70 text-slate-500 text-[11px] font-sans font-medium">
                              Non testato
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[13px] text-white tabular-nums">
                                {displayVal}
                              </span>
                              {delta && (
                                <span
                                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${
                                    delta.startsWith('+')
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  }`}
                                >
                                  {delta}
                                </span>
                              )}
                            </div>
                          )}

                          {/* HOVER TOOLTIP INTERATTIVO */}
                          {tooltipData && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-64 p-3.5 rounded-2xl bg-slate-900 border border-slate-600 shadow-2xl text-xs font-sans pointer-events-none text-left">
                              <div className="font-bold text-slate-100 text-xs border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between">
                                <span>{tooltipData.title}</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-300 py-0.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  Gamba SX:
                                </span>
                                <strong className="text-white font-mono">{tooltipData.sx}</strong>
                              </div>
                              <div className="flex justify-between items-center text-slate-300 py-0.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  Gamba DX:
                                </span>
                                <strong className="text-white font-mono">{tooltipData.dx}</strong>
                              </div>
                              <div className="flex justify-between items-center text-slate-100 border-t border-slate-700 pt-1.5 mt-1.5 font-semibold">
                                <span>Simmetria:</span>
                                <strong className="text-emerald-400 font-mono">{tooltipData.asym}</strong>
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
      <div className="lg:col-span-4 bg-slate-800/80 p-5 rounded-3xl border border-slate-700/60 space-y-4 shadow-xl backdrop-blur-sm w-full flex flex-col justify-between">

        {/* Header Barre Target */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 border border-slate-700/70 rounded-xl text-amber-400 shadow-xs">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide uppercase">
                BARRE TARGET &amp; PROGRESSO
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Ultimo dato valido rilevato (ignora test non eseguiti)
              </p>
            </div>
          </div>
        </div>

        {/* Selezione Fase Target (Pillole F1, F2, F3, F4, F5) */}
        <div className="space-y-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">TARGET FASE:</span>
            <span className="text-slate-100 font-bold text-xs">{selectedPhase}</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-xs font-bold">
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
                  onClick={() => setSelectedPhase(pObj.key)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm border border-emerald-400/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/70 hover:text-slate-100 hover:bg-slate-700/60'
                  }`}
                >
                  {pObj.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BARRE DI PROGRESSO AD ALTO CONTRASTO: TITOLO INTERO LEGGIBILE, NESSUNA DATA, TESTO SOPRA LA BARRA */}
        <div className="space-y-3">
          {cupsData.map((cup) => {
            if (cup.earlyNote) {
              return (
                <div key={cup.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 text-slate-100 text-xs space-y-1.5">
                  <div className="font-semibold text-sm text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="whitespace-normal break-words">{cup.title} — {cup.subtitle}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{cup.earlyNote}</p>
                </div>
              );
            }

            const isEvaluated = cup.value !== null && cup.value !== undefined;
            const fillPct = isEvaluated ? Math.min(100, Math.max(8, cup.percentageAchieved)) : 0;
            const isTargetOk = cup.isOk;
            const cleanTargetText = cup.targetLabel ? cup.targetLabel.replace('Target:', 'Target') : '';

            return (
              <div
                key={cup.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/70 space-y-2.5 hover:border-slate-500/80 transition-all shadow-sm"
              >
                {/* Riga 1: Titolo Metrica COMPLETO E LEGGIBILE (senza truncate e senza data) + Badge Stato */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13px] font-semibold text-slate-100 tracking-wide leading-snug whitespace-normal break-words flex-1">
                    {cup.title}
                  </span>

                  {/* Badge Stato ad alto contrasto */}
                  <div className="shrink-0 pt-0.5">
                    {!isEvaluated ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase">
                        NON TESTATO
                      </span>
                    ) : isTargetOk ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        TARGET OK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase flex items-center gap-1">
                        IN CORSO
                      </span>
                    )}
                  </div>
                </div>

                {/* Riga 2 (SOPRA LA BARRA): Valore Numerico / Target + % Raggiungimento */}
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono tabular-nums">
                    {isEvaluated ? (
                      <>
                        <span className="text-base font-extrabold text-white">
                          {cup.displayVal}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 ml-1.5">
                          / {cleanTargetText}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        Non testato (N/A) — {cleanTargetText}
                      </span>
                    )}
                  </div>

                  {isEvaluated && (
                    <span
                      className={`text-xs font-mono font-bold tabular-nums ${
                        isTargetOk ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {cup.percentageAchieved}%
                    </span>
                  )}
                </div>

                {/* Riga 3: Barra di Progresso pura (h-3.5 = 14px, nessun testo sovrapposto) */}
                <div className="w-full h-3.5 bg-slate-950 rounded-full border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      !isEvaluated
                        ? 'bg-slate-800/40'
                        : isTargetOk
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                    }`}
                    style={{ width: `${isEvaluated ? fillPct : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* CHECKLIST QUALITATIVA */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/70 space-y-2.5 mt-1">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wider">
                Checklist Qualitativa ({selectedPhase})
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
              {Object.values(currentChecklistState).filter(Boolean).length}/{currentChecklistItems.length} OK
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {currentChecklistItems.map((item) => {
              const isChecked = currentChecklistState[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => setCurrentChecklistState(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`p-2.5 px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-slate-800 border-emerald-500/50 text-slate-100 font-semibold'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold whitespace-normal leading-snug">
                    {item.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                      isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SEZIONE 3: GRAFICO MULTIMETRICA INTERATTIVO (FILTRA RIGOROSAMENTE I NULL) */}
      {/* ========================================================================= */}
      <div className="w-full lg:col-span-12 block pt-1">
        <UIErrorBoundary title="Grafico Multimetrico Temporaneamente Non Disponibile">
          <GraficoMultimetrica tests={displayedSessions} />
        </UIErrorBoundary>
      </div>

      {/* MODAL RILEVAZIONE MODULARE TEST CLINICI LCA */}
      <ModalNuovaValutazione
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTest(null);
        }}
        patient={patient}
        initialData={editingTest}
        initialModule={initialModalModule}
        onSaveEvaluation={handleModalSave}
      />

    </div>
  );
}
