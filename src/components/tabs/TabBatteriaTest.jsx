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
  CalendarRange,
  Sliders,
  Trash2,
  X,
  AlertTriangle
} from 'lucide-react';
import ModalNuovaValutazione from '../ModalNuovaValutazione';
import GraficoMultimetrica from '../GraficoMultimetrica';
import {
  createTestObject,
  mergeTestIntoSession,
  aggregateTestsIntoSessions,
  saveTestToSupabase,
  deleteTestsFromSupabase,
  clearTestModuleFromSession,
  clearSingleRowFromSession,
  sortTestsByDate,
  getLastValidMetricWithMeta,
  extractMetricFromSingleTest,
  toStrictNullOrNumber,
  calculateHqRatioPercent,
  calculateLimbLsi,
  resolveOperatedLimb,
  hideCustomMetricInSupabase
} from '../../utils/testUtils';
import { UIErrorBoundary } from '../UIErrorBoundary';

const safeFixed = (val, decimals = 1, fallback = 'N/A') => {
  const n = toStrictNullOrNumber(val, false);
  return n === null ? fallback : n.toFixed(decimals);
};

const calcRatioLsi = (valSX, valDX, operatedLimb = 'DX') => {
  const lsi = calculateLimbLsi(valSX, valDX, operatedLimb);
  return lsi !== null ? lsi.toFixed(1) : null;
};

/**
 * Calcola dinamicamente la percentuale di completamento, il colore barra e il badge stato
 * seguendo il rulebook clinico a 5 fasi:
 * - < 70%: Red bar (bg-rose-500) | Badge: "DEFICIT"
 * - 70% - 89%: Orange bar (bg-amber-500) | Badge: "IN CORSO"
 * - 90% - 99%: Cyan bar (bg-cyan-500) | Badge: "IN CORSO"
 * - >= 100%: Green bar (bg-emerald-500) | Badge: "TARGET OK"
 */
function buildPhaseTargetItem({
  id,
  title,
  latestValue,
  phaseTargetValue,
  unit = '%',
  decimals = 1,
  comparison = 'gt',
  targetLabelOverride = null
}) {
  const isEvaluated = latestValue !== null && latestValue !== undefined && !Number.isNaN(Number(latestValue));
  const numVal = isEvaluated ? Number(latestValue) : null;

  let completionPercentage = 0;
  let isOk = false;

  if (isEvaluated && phaseTargetValue > 0) {
    if (comparison === 'lt') {
      // Per le asimmetrie (<10%), un valore minore o uguale al target equivale al 100% di raggiungimento
      if (numVal <= phaseTargetValue) {
        completionPercentage = 100;
        isOk = true;
      } else {
        completionPercentage = Math.max(0, Math.min(99, Math.round((phaseTargetValue / numVal) * 100)));
        isOk = false;
      }
    } else {
      completionPercentage = Math.min(100, Math.round((numVal / phaseTargetValue) * 100));
      isOk = completionPercentage >= 100;
    }
  }

  let barColor = 'bg-slate-300';
  let badgeText = 'NON TESTATO';
  let badgeClass = 'bg-slate-200/70 border-slate-300 text-slate-600';
  let pctBadgeClass = 'bg-slate-200/70 text-slate-600';

  if (isEvaluated) {
    if (completionPercentage >= 100) {
      barColor = 'bg-emerald-500';
      badgeText = 'TARGET OK';
      badgeClass = 'bg-emerald-100/80 border-emerald-300/60 text-emerald-900';
      pctBadgeClass = 'bg-emerald-100/80 text-emerald-900';
    } else if (completionPercentage >= 90) {
      barColor = 'bg-cyan-500';
      badgeText = 'IN CORSO';
      badgeClass = 'bg-cyan-100/80 border-cyan-300/60 text-cyan-900';
      pctBadgeClass = 'bg-cyan-100/80 text-cyan-900';
    } else if (completionPercentage >= 70) {
      barColor = 'bg-amber-500';
      badgeText = 'IN CORSO';
      badgeClass = 'bg-amber-100/80 border-amber-300/60 text-amber-900';
      pctBadgeClass = 'bg-amber-100/80 text-amber-900';
    } else {
      barColor = 'bg-rose-500';
      badgeText = 'DEFICIT';
      badgeClass = 'bg-rose-100/80 border-rose-300/60 text-rose-900';
      pctBadgeClass = 'bg-rose-100/80 text-rose-900';
    }
  }

  const formattedVal = isEvaluated ? Number(numVal).toFixed(decimals) : null;
  const displayVal = isEvaluated
    ? unit === '/100'
      ? `${formattedVal}/100`
      : unit === '%'
      ? `${formattedVal}%`
      : `${formattedVal} ${unit}`
    : 'Non testato';

  const defaultTargetLabel =
    comparison === 'lt'
      ? `Target <${phaseTargetValue}${unit === '%' ? '%' : ` ${unit}`}`
      : unit === '/100'
      ? `Target >${phaseTargetValue}/100`
      : unit === '%'
      ? `Target >${phaseTargetValue}%`
      : `Target >${phaseTargetValue} ${unit}`;

  return {
    id,
    title,
    value: numVal,
    displayVal,
    targetLabel: targetLabelOverride || defaultTargetLabel,
    percentageAchieved: completionPercentage,
    isOk,
    barColor,
    badgeText,
    badgeClass,
    pctBadgeClass
  };
}

export function normalizePhaseKey(fase) {
  if (!fase) return 'Fase 3 (>80%)';
  const str = String(fase).toLowerCase();
  if (str.includes('1') || str.includes('early') || str.includes('rom')) return 'Fase 1';
  if (str.includes('2') || str.includes('mid') || str.includes('forza')) return 'Fase 2 (>70%)';
  if (str.includes('3') || str.includes('run') || str.includes('power') || str.includes('drills')) return 'Fase 3 (>80%)';
  if (str.includes('4') || str.includes('late') || str.includes('cod') || str.includes('agility')) return 'Fase 4';
  if (str.includes('5') || str.includes('perf') || str.includes('rts') || str.includes('sport') || str.includes('play')) return 'Fase 5 (RTS)';
  return 'Fase 3 (>80%)';
}

/**
 * Custom Hook che implementa la 5-Phase Target Architecture:
 * - Interroga automaticamente l'ULTIMO test valido registrato per ciascuna metrica (zero perdita dati).
 * - Filtra rigorosamente le barre di progresso e i domini di salto in base alla fase attiva.
 * - Calcola l'H/Q Ratio con la formula esatta: (Hamstring 30° Peak Force N / Quad 60° Peak Force N) * 100.
 */
export function usePhaseProgress(testsHistory, selectedPhase, patient = null) {
  const normalizedPhase = normalizePhaseKey(selectedPhase);
  const operatedLimb = resolveOperatedLimb(patient, 'DX');
  // Deep signature garantisce che qualsiasi modifica interna agli oggetti test (es. SX/DX) attivi il ricalcolo istantaneo
  const testsDeepSignature = JSON.stringify(testsHistory);

  return useMemo(() => {
    const opts = { operatedLimb };
    const optsAllowZero = { allowZero: true, operatedLimb };

    const lsiQuadVal = getLastValidMetricWithMeta(testsHistory, ['lsiQuad', 'lsi_quad_calculated'], opts)?.value ?? null;
    const lsiFlexVal = getLastValidMetricWithMeta(testsHistory, ['lsiFlex', 'lsi_curl_calculated'], opts)?.value ?? null;
    const quadRelVal = getLastValidMetricWithMeta(testsHistory, ['quadOpNmKg', 'quad_rel_op'], opts)?.value ?? null;

    // Calcolo H/Q Ratio: (Hamstring 30° Peak Force N / Quad 60° Peak Force N) * 100 sull'arto operato
    const quadKeys =
      operatedLimb === 'SX'
        ? ['iso_leg_ext_sx', 'quadSano', 'iso_leg_ext_dx', 'quadOp']
        : ['iso_leg_ext_dx', 'quadOp', 'iso_leg_ext_sx', 'quadSano'];
    const hamKeys =
      operatedLimb === 'SX'
        ? ['iso_leg_curl_sx', 'flexSano', 'iso_leg_curl_dx', 'flexOp']
        : ['iso_leg_curl_dx', 'flexOp', 'iso_leg_curl_sx', 'flexSano'];

    const directHqPctMeta = getLastValidMetricWithMeta(testsHistory, ['hqRatioPct', 'hq_ratio_pct'], opts);
    const quadPeakMeta = getLastValidMetricWithMeta(testsHistory, quadKeys, opts);
    const hamPeakMeta = getLastValidMetricWithMeta(testsHistory, hamKeys, opts);

    let hqRatioPctVal = directHqPctMeta?.value ?? null;
    if (quadPeakMeta?.value && hamPeakMeta?.value) {
      const computedHq = calculateHqRatioPercent(hamPeakMeta.value, quadPeakMeta.value);
      if (computedHq > 0) {
        hqRatioPctVal = computedHq;
      }
    }

    const squatAsymVal =
      getLastValidMetricWithMeta(testsHistory, ['squatLoadAsym', 'squat_bilateral_load_asymmetry'], optsAllowZero)
        ?.value ?? null;
    const ikdcVal = getLastValidMetricWithMeta(testsHistory, ['ikdc', 'ikdc_score'], opts)?.value ?? null;
    const slCmjHeightLsiVal =
      getLastValidMetricWithMeta(testsHistory, ['slCmjHeightLsi', 'lsi_sl_cmj_height_calculated'], opts)?.value ?? null;
    const slCmjBrakingLsiVal =
      getLastValidMetricWithMeta(testsHistory, ['slCmjBrakingLsi', 'cmjImpulseLsi', 'lsi_cmj_braking'], opts)?.value ?? null;
    const djBilateralRsiVal =
      getLastValidMetricWithMeta(testsHistory, ['rsiDropJump', 'djRSI', 'dj_rsi', 'rsi_drop_jump'], opts)?.value ?? null;
    const slDjRsiLsiVal =
      getLastValidMetricWithMeta(testsHistory, ['slDjRsiLsi', 'lsi_sl_dj_rsi'], opts)?.value ?? null;
    const hopLsiAvgVal =
      getLastValidMetricWithMeta(testsHistory, ['hopTestLsiAvg', 'lsiSingleHop', 'lsiTripleHop'], opts)?.value ?? null;
    const codAsymVal =
      getLastValidMetricWithMeta(testsHistory, ['codAsym', 'cod_deficit_asym'], optsAllowZero)?.value ?? null;
    const aclRsiVal = getLastValidMetricWithMeta(testsHistory, ['aclrsi', 'acl_rsi'], opts)?.value ?? null;

    // FASE 1 (Early Stage): Nasconde tutti i test di salto e pliometria
    if (normalizedPhase === 'Fase 1') {
      return {
        phaseKey: 'phase1',
        allowedSubTabs: ['LSI', 'FORZA'],
        checklistItems: [
          { id: 'extComplete0', label: 'Estensione completa (0°)' },
          { id: 'flex120', label: 'Flessione >=120°' },
          { id: 'strokeTest', label: 'Stroke Test <=1+' },
          { id: 'slrNoLag', label: 'SLR (No lag)' }
        ],
        cupsData: [
          buildPhaseTargetItem({
            id: 'f1_iso_quad_90',
            title: 'Iso Quad 90° LSI (>60%)',
            latestValue: lsiQuadVal,
            phaseTargetValue: 60,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f1_iso_ham_90',
            title: 'Iso Hamstring 90° LSI (>60%)',
            latestValue: lsiFlexVal,
            phaseTargetValue: 60,
            unit: '%',
            decimals: 1
          })
        ]
      };
    }

    // FASE 2 (Mid Stage): Nasconde SL Jumps & Drop Jumps
    if (normalizedPhase === 'Fase 2 (>70%)') {
      return {
        phaseKey: 'phase2',
        allowedSubTabs: ['LSI', 'FORZA', 'CMJ_BILATERAL'],
        checklistItems: [
          { id: 'pogoJumpBilateral', label: 'Pogo Jump Bilaterale' },
          { id: 'landingControl', label: 'Landing Control' }
        ],
        cupsData: [
          buildPhaseTargetItem({
            id: 'f2_iso_quad',
            title: 'Iso Quad 60° (or 90°) LSI (>75%)',
            latestValue: lsiQuadVal,
            phaseTargetValue: 75,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f2_rel_quad',
            title: 'Relative Quad Force (>2.2 N/kg)',
            latestValue: quadRelVal,
            phaseTargetValue: 2.2,
            unit: 'N/kg',
            decimals: 2
          }),
          buildPhaseTargetItem({
            id: 'f2_iso_ham',
            title: 'Iso Hamstring 30° LSI (>75%)',
            latestValue: lsiFlexVal,
            phaseTargetValue: 75,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f2_hq_ratio',
            title: 'H/Q Ratio (>55%)',
            latestValue: hqRatioPctVal,
            phaseTargetValue: 55,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f2_squat_asym',
            title: 'Squat Bilateral Load Asymmetry (<10%)',
            latestValue: squatAsymVal,
            phaseTargetValue: 10,
            unit: '%',
            decimals: 1,
            comparison: 'lt'
          }),
          buildPhaseTargetItem({
            id: 'f2_ikdc',
            title: 'IKDC Subjective Score (>60/100)',
            latestValue: ikdcVal,
            phaseTargetValue: 60,
            unit: '/100',
            decimals: 1
          })
        ]
      };
    }

    // FASE 3 (Return to Run): Nasconde SL Drop Jump
    if (normalizedPhase === 'Fase 3 (>80%)') {
      return {
        phaseKey: 'phase3',
        allowedSubTabs: ['LSI', 'FORZA', 'CMJ_BILATERAL', 'CMJ_SL', 'DJ_BILATERAL'],
        checklistItems: [
          { id: 'treadmillRun10Min', label: '10-min Treadmill Run without 24h pain/swelling' }
        ],
        cupsData: [
          buildPhaseTargetItem({
            id: 'f3_iso_quad',
            title: 'Iso Quad 60° LSI (>85%)',
            latestValue: lsiQuadVal,
            phaseTargetValue: 85,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f3_iso_ham',
            title: 'Iso Hamstring 30° LSI (>85%)',
            latestValue: lsiFlexVal,
            phaseTargetValue: 85,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f3_hq_ratio',
            title: 'H/Q Ratio (>60%)',
            latestValue: hqRatioPctVal,
            phaseTargetValue: 60,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f3_sl_cmj_height',
            title: 'SL CMJ Jump Height LSI (>80%)',
            latestValue: slCmjHeightLsiVal,
            phaseTargetValue: 80,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f3_dj_rsi',
            title: 'Drop Jump Bilateral RSI (>1.35 m/s)',
            latestValue: djBilateralRsiVal,
            phaseTargetValue: 1.35,
            unit: 'm/s',
            decimals: 2
          })
        ]
      };
    }

    // FASE 4 (Late Stage)
    if (normalizedPhase === 'Fase 4') {
      const djBilPct = djBilateralRsiVal !== null ? Math.min(100, Math.round((djBilateralRsiVal / 1.5) * 100)) : -1;
      const slDjPct = slDjRsiLsiVal !== null ? Math.min(100, Math.round((slDjRsiLsiVal / 80) * 100)) : -1;
      const useSlDj = slDjPct > djBilPct;

      const djItem = useSlDj
        ? buildPhaseTargetItem({
            id: 'f4_dj_rsi',
            title: 'Drop Jump Bilateral RSI (>1.50 m/s or SL Drop Jump RSI LSI >80%)',
            latestValue: slDjRsiLsiVal,
            phaseTargetValue: 80,
            unit: '%',
            decimals: 1,
            targetLabelOverride: 'Target >1.50 m/s o SL RSI >80%'
          })
        : buildPhaseTargetItem({
            id: 'f4_dj_rsi',
            title: 'Drop Jump Bilateral RSI (>1.50 m/s or SL Drop Jump RSI LSI >80%)',
            latestValue: djBilateralRsiVal,
            phaseTargetValue: 1.5,
            unit: 'm/s',
            decimals: 2,
            targetLabelOverride: 'Target >1.50 m/s o SL RSI >80%'
          });

      return {
        phaseKey: 'phase4',
        allowedSubTabs: ['LSI', 'FORZA', 'CMJ_BILATERAL', 'CMJ_SL', 'DJ_BILATERAL', 'DJ_SL'],
        checklistItems: [
          { id: 'slDropJumpBox30', label: 'SL Drop Jump OK' },
          { id: 'firstFieldTech', label: 'Primi Gesti Campo' },
          { id: 'weeklyLoadTolerance', label: 'Tolleranza Carichi' }
        ],
        cupsData: [
          buildPhaseTargetItem({
            id: 'f4_iso_quad',
            title: 'Iso Quad 60° LSI (>90%)',
            latestValue: lsiQuadVal,
            phaseTargetValue: 90,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f4_iso_ham',
            title: 'Iso Hamstring 30° LSI (>90%)',
            latestValue: lsiFlexVal,
            phaseTargetValue: 90,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f4_sl_cmj_height',
            title: 'SL CMJ Jump Height LSI (>85%)',
            latestValue: slCmjHeightLsiVal,
            phaseTargetValue: 85,
            unit: '%',
            decimals: 1
          }),
          buildPhaseTargetItem({
            id: 'f4_sl_cmj_braking',
            title: 'SL CMJ Braking Impulse LSI (>85%)',
            latestValue: slCmjBrakingLsiVal,
            phaseTargetValue: 85,
            unit: '%',
            decimals: 1
          }),
          djItem
        ]
      };
    }

    // FASE 5 (Return to Play)
    return {
      phaseKey: 'phase5',
      allowedSubTabs: ['LSI', 'FORZA', 'CMJ_BILATERAL', 'CMJ_SL', 'DJ_BILATERAL', 'DJ_SL'],
      checklistItems: [
        { id: 'fullTeamTraining', label: 'Full Team Training senza restrizioni' },
        { id: 'reactiveAgility', label: 'Sprint Massimale & CoD Reattivo' },
        { id: 'rtsClearance', label: 'Clearance Medico-Sportiva Return to Play' }
      ],
      cupsData: [
        buildPhaseTargetItem({
          id: 'f5_iso_quad',
          title: 'Iso Quad 60° LSI (>90%)',
          latestValue: lsiQuadVal,
          phaseTargetValue: 90,
          unit: '%',
          decimals: 1
        }),
        buildPhaseTargetItem({
          id: 'f5_iso_ham',
          title: 'Iso Hamstring 30° LSI (>90%)',
          latestValue: lsiFlexVal,
          phaseTargetValue: 90,
          unit: '%',
          decimals: 1
        }),
        buildPhaseTargetItem({
          id: 'f5_hop_avg',
          title: 'Single/Triple Hop Test LSI Average (>95%)',
          latestValue: hopLsiAvgVal,
          phaseTargetValue: 95,
          unit: '%',
          decimals: 1
        }),
        buildPhaseTargetItem({
          id: 'f5_cod_asym',
          title: 'CoD Deficit Time Asymmetry (<10%)',
          latestValue: codAsymVal,
          phaseTargetValue: 10,
          unit: '%',
          decimals: 1,
          comparison: 'lt'
        }),
        buildPhaseTargetItem({
          id: 'f5_acl_rsi',
          title: 'ACL-RSI Score (>75/100)',
          latestValue: aclRsiVal,
          phaseTargetValue: 75,
          unit: '/100',
          decimals: 1
        })
      ]
    };
  }, [testsHistory, testsDeepSignature, normalizedPhase, operatedLimb]);
}

export default function TabBatteriaTest({
  patient,
  selectedPhase: externalSelectedPhase,
  activePhase,
  onSelectPhase,
  onSaveTest
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [initialModalModule, setInitialModalModule] = useState('ISO_EXT');
  const [groupByReportSession, setGroupByReportSession] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('CMJ_BILATERAL');
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const operatedLimb = resolveOperatedLimb(patient, 'DX');

  const getDefaultModuleForSubTab = (subTab) => {
    switch (subTab) {
      case 'LSI':
        return 'CLINICAL_SCORES';
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

  // Mappa la sotto-tab ai codici `test_type` di cui mostrare le metriche personalizzate
  const getCustomTestTypesForSubTab = (subTab) => {
    switch (subTab) {
      case 'LSI':
        return ['SCORE_CLINICI', 'ISO_PUSH_LEG_EXT', 'ISO_PUSH_LEG_CURL'];
      case 'FORZA':
        return ['ISO_PUSH_LEG_EXT', 'ISO_PUSH_LEG_CURL', 'FORZA_ACCESSORIA'];
      case 'CMJ_BILATERAL':
        return ['CMJ_BILATERALE'];
      case 'CMJ_SL':
        return ['CMJ_MONOPODALICO'];
      case 'DJ_BILATERAL':
        return ['RSI_DROP_JUMP'];
      case 'DJ_SL':
        return ['SL_DROP_JUMP'];
      default:
        return ['ISO_PUSH_LEG_EXT'];
    }
  };

  const controlledPhaseSource =
    externalSelectedPhase || activePhase || patient?.fase_attuale || patient?.fase_riabilitativa;
  const [localPhaseFallback, setLocalPhaseFallback] = useState(() =>
    normalizePhaseKey(controlledPhaseSource)
  );

  React.useEffect(() => {
    if (controlledPhaseSource) {
      setLocalPhaseFallback(normalizePhaseKey(controlledPhaseSource));
    }
  }, [controlledPhaseSource]);

  // Single Source of Truth: legge direttamente la fase selezionata in "Monitoraggio e Diario" (PatientDetail)
  const selectedPhase = controlledPhaseSource
    ? normalizePhaseKey(controlledPhaseSource)
    : localPhaseFallback;

  const handleSelectPhaseClick = (newPhaseKey) => {
    setLocalPhaseFallback(normalizePhaseKey(newPhaseKey));
    if (onSelectPhase) {
      onSelectPhase(newPhaseKey);
    }
  };

  const [checklistStateByPhase, setChecklistStateByPhase] = useState({
    phase1: {
      extComplete0: true,
      flex120: true,
      strokeTest: true,
      slrNoLag: true
    },
    phase2: {
      pogoJumpBilateral: false,
      landingControl: true
    },
    phase3: {
      treadmillRun10Min: true
    },
    phase4: {
      slDropJumpBox30: true,
      firstFieldTech: true,
      weeklyLoadTolerance: true
    },
    phase5: {
      fullTeamTraining: true,
      reactiveAgility: true,
      rtsClearance: true
    }
  });

  const [testsHistory, setTestsHistory] = useState(() => sortTestsByDate(patient?.tests));
  const [selectedTestId, setSelectedTestId] = useState(() => {
    const cleanTests = sortTestsByDate(patient?.tests);
    return cleanTests.length > 0 ? cleanTests[cleanTests.length - 1].id : null;
  });

  const patientTestsSignature = JSON.stringify(patient?.tests || []);

  React.useEffect(() => {
    const cleanTests = sortTestsByDate(patient?.tests);
    setTestsHistory(cleanTests);
    setSelectedTestId((prevId) => {
      if (cleanTests.length === 0) return null;
      if (prevId && cleanTests.some((t) => t.id === prevId)) return prevId;
      return cleanTests[cleanTests.length - 1].id;
    });
  }, [patient?.id, patientTestsSignature]);

  const testsHistorySignature = JSON.stringify(testsHistory);

  const displayedSessions = useMemo(() => {
    if (groupByReportSession) {
      return aggregateTestsIntoSessions(testsHistory, 14);
    }
    return testsHistory;
  }, [testsHistory, testsHistorySignature, groupByReportSession]);

  const activeTest =
    displayedSessions.find(t => t.id === selectedTestId) ||
    (displayedSessions.length > 0 ? displayedSessions[displayedSessions.length - 1] : null);

  const {
    phaseKey,
    allowedSubTabs,
    checklistItems: currentChecklistItems,
    cupsData
  } = usePhaseProgress(testsHistory, selectedPhase, patient);

  React.useEffect(() => {
    if (Array.isArray(allowedSubTabs) && allowedSubTabs.length > 0 && !allowedSubTabs.includes(activeSubTab)) {
      setActiveSubTab(allowedSubTabs[0]);
    }
  }, [allowedSubTabs, activeSubTab]);

  const handleModalSave = async (newValData) => {
    const targetId = newValData.id || editingTest?.id;
    const sourceIdsSet = new Set([
      ...(Array.isArray(newValData.sourceIds) ? newValData.sourceIds : []),
      ...(Array.isArray(editingTest?.sourceIds) ? editingTest.sourceIds : []),
      ...(targetId ? [targetId] : [])
    ]);

    const payloadWithLimb = {
      ...newValData,
      ginocchio_operato: resolveOperatedLimb(newValData, operatedLimb)
    };

    const matchingTests = testsHistory.filter(t => sourceIdsSet.has(t.id));

    if (matchingTests.length > 0) {
      // Unisce tutte le rilevazioni appartenenti alla sessione modificata e ricalcola LSI, H/Q Ratio, N/kg e RSI
      let baseComposite = matchingTests[0];
      for (let i = 1; i < matchingTests.length; i++) {
        baseComposite = mergeTestIntoSession(baseComposite, matchingTests[i], patient?.id);
      }

      const mergedSession = mergeTestIntoSession(baseComposite, payloadWithLimb, patient?.id);
      const primaryId = targetId || mergedSession.id;
      const finalMerged = { ...mergedSession, id: primaryId };

      await saveTestToSupabase(finalMerged);

      let replaced = false;
      const updated = [];
      for (const existingTest of testsHistory) {
        if (sourceIdsSet.has(existingTest.id)) {
          if (!replaced) {
            updated.push(finalMerged);
            replaced = true;
          }
        } else {
          updated.push(existingTest);
        }
      }

      const sortedUpdated = sortTestsByDate(updated);
      setTestsHistory(sortedUpdated);
      setSelectedTestId(primaryId);
      setEditingTest(null);

      if (onSaveTest) {
        onSaveTest(sortedUpdated);
      }
    } else {
      const newNum = testsHistory.length + 1;
      const newTest = createTestObject(payloadWithLimb, patient?.id, newNum);

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

  // Elimina/Nasconde una metrica personalizzata direttamente dalla tabella longitudinale
  const handleHideCustomMetricFromTable = async (testType, metricName) => {
    const updatedHistory = testsHistory.map(session => {
      const cm = session.custom_metrics;
      if (!cm || !Array.isArray(cm[testType])) return session;
      const nextList = cm[testType].map(item => {
        if (item.metric_name?.trim().toLowerCase() === metricName.trim().toLowerCase()) {
          return { ...item, is_hidden: true };
        }
        return item;
      });
      return {
        ...session,
        custom_metrics: {
          ...cm,
          [testType]: nextList
        }
      };
    });

    const sortedUpdated = sortTestsByDate(updatedHistory);
    setTestsHistory(sortedUpdated);
    if (onSaveTest) {
      onSaveTest(sortedUpdated);
    }
    if (patient?.id) {
      await hideCustomMetricInSupabase(patient.id, testType, metricName);
    }
  };

  // Elimina un'intera sessione di test (e tutte le sotto-rilevazioni associate in sourceIds)
  const handleDeleteEntireSession = async (sessionObj) => {
    if (!sessionObj) return;
    const idsToDelete = new Set([
      ...(Array.isArray(sessionObj.sourceIds) ? sessionObj.sourceIds : []),
      ...(sessionObj.id ? [sessionObj.id] : [])
    ]);

    const remaining = testsHistory.filter((t) => !idsToDelete.has(t.id));
    const sortedRemaining = sortTestsByDate(remaining);

    setTestsHistory(sortedRemaining);
    setSelectedTestId(
      sortedRemaining.length > 0 ? sortedRemaining[sortedRemaining.length - 1].id : null
    );
    setSessionToDelete(null);

    await deleteTestsFromSupabase(Array.from(idsToDelete));

    if (onSaveTest) {
      onSaveTest(sortedRemaining);
    }
  };

  // Elimina solo uno specifico modulo/test da una sessione (es. solo Iso Push Leg Ext, solo CMJ, ecc.)
  const handleDeleteTestModuleFromSession = async (sessionObj, moduleId) => {
    if (!sessionObj || !moduleId) return;
    const idsToUpdate = new Set([
      ...(Array.isArray(sessionObj.sourceIds) ? sessionObj.sourceIds : []),
      ...(sessionObj.id ? [sessionObj.id] : [])
    ]);

    const matchingTests = testsHistory.filter((t) => idsToUpdate.has(t.id));
    let composite = sessionObj;
    if (matchingTests.length > 0) {
      composite = matchingTests[0];
      for (let i = 1; i < matchingTests.length; i++) {
        composite = mergeTestIntoSession(composite, matchingTests[i], patient?.id);
      }
    }

    const clearedSession = clearTestModuleFromSession(composite, moduleId, operatedLimb);
    const primaryId = sessionObj.id || clearedSession.id;
    const finalCleaned = { ...clearedSession, id: primaryId };

    await saveTestToSupabase(finalCleaned);

    let replaced = false;
    const updated = [];
    for (const existingTest of testsHistory) {
      if (idsToUpdate.has(existingTest.id)) {
        if (!replaced) {
          updated.push(finalCleaned);
          replaced = true;
        }
      } else {
        updated.push(existingTest);
      }
    }

    const sortedUpdated = sortTestsByDate(updated);
    setTestsHistory(sortedUpdated);
    setSelectedTestId(primaryId);
    setSessionToDelete(finalCleaned);

    if (onSaveTest) {
      onSaveTest(sortedUpdated);
    }
  };

  // Elimina rapidamente un singolo parametro/valore (cella) da una sessione
  const handleDeleteSingleCellMetric = async (sessionObj, row) => {
    if (!sessionObj || !row) return;
    const idsToUpdate = new Set([
      ...(Array.isArray(sessionObj.sourceIds) ? sessionObj.sourceIds : []),
      ...(sessionObj.id ? [sessionObj.id] : [])
    ]);

    const matchingTests = testsHistory.filter((t) => idsToUpdate.has(t.id));
    let composite = sessionObj;
    if (matchingTests.length > 0) {
      composite = matchingTests[0];
      for (let i = 1; i < matchingTests.length; i++) {
        composite = mergeTestIntoSession(composite, matchingTests[i], patient?.id);
      }
    }

    let finalCleaned;
    if (row.isCustomMetric) {
      const cm = composite.custom_metrics || {};
      const list = Array.isArray(cm[row.customTestType]) ? cm[row.customTestType] : [];
      const nextList = list.map((item) =>
        item.metric_name?.trim().toLowerCase() === row.customMetricName?.trim().toLowerCase()
          ? { ...item, metric_value: null }
          : item
      );
      finalCleaned = {
        ...composite,
        id: sessionObj.id || composite.id,
        custom_metrics: {
          ...cm,
          [row.customTestType]: nextList
        }
      };
    } else {
      const cleared = clearSingleRowFromSession(composite, row.key, operatedLimb);
      finalCleaned = { ...cleared, id: sessionObj.id || cleared.id };
    }

    await saveTestToSupabase(finalCleaned);

    let replaced = false;
    const updated = [];
    for (const existingTest of testsHistory) {
      if (idsToUpdate.has(existingTest.id)) {
        if (!replaced) {
          updated.push(finalCleaned);
          replaced = true;
        }
      } else {
        updated.push(existingTest);
      }
    }

    const sortedUpdated = sortTestsByDate(updated);
    setTestsHistory(sortedUpdated);

    if (onSaveTest) {
      onSaveTest(sortedUpdated);
    }
  };

  // Elenca i moduli di test effettivamente compilati dentro una sessione (per il modale di eliminazione selettiva)
  const getPopulatedModulesForSession = (sess) => {
    if (!sess) return [];
    const hasVal = (...vals) => vals.some((v) => toStrictNullOrNumber(v, false) !== null);
    const modules = [
      {
        id: 'ISO_EXT',
        label: 'Iso Push Leg Ext (Quadricipite SX/DX & LSI)',
        isPopulated: hasVal(sess.quadSano, sess.quadOp, sess.iso_leg_ext_sx, sess.iso_leg_ext_dx, sess.lsiQuad)
      },
      {
        id: 'ISO_CURL',
        label: 'Iso Push Leg Curl (Ischiocrurali SX/DX & H/Q)',
        isPopulated: hasVal(sess.flexSano, sess.flexOp, sess.iso_leg_curl_sx, sess.iso_leg_curl_dx, sess.lsiFlex)
      },
      {
        id: 'FORZA_DINAMICA',
        label: 'Forza Accessoria & IMTP (Bulgarian, Calf, Soleo, IMTP)',
        isPopulated: hasVal(sess.bulgarianSX, sess.bulgarianDX, sess.calfRaiseSX, sess.calfRaiseDX, sess.soleoSX, sess.soleoDX, sess.imtpForce)
      },
      {
        id: 'CMJ_BILATERAL',
        label: 'CMJ Bilaterale (Altezza, RSImod, Impulse SX/DX)',
        isPopulated: hasVal(sess.jumpHeight, sess.contractionTime, sess.peakPower, sess.cmjDepth, sess.eccBrakingRfd, sess.concImpulseSX, sess.concImpulseDX, sess.eccBrakingSX, sess.eccBrakingDX)
      },
      {
        id: 'CMJ_SL',
        label: 'CMJ Monopodalico (Single Leg Jump SX/DX)',
        isPopulated: hasVal(sess.slCmjHeightSX, sess.slCmjHeightDX, sess.slCmjPeakPowerSX, sess.slCmjPeakPowerDX, sess.slCmjRsiSX, sess.slCmjRsiDX, sess.slCmjDepthSX, sess.slCmjDepthDX)
      },
      {
        id: 'DJ_BILATERAL',
        label: 'Drop Jump Bilaterale (RSI, GCT, Force Plates)',
        isPopulated: hasVal(sess.djJumpHeight, sess.djContactTime, sess.rsiDropJump, sess.djTtpfMs, sess.djLandingPeakSX, sess.djLandingPeakDX, sess.djConcImpulseSX, sess.djConcImpulseDX)
      },
      {
        id: 'DJ_SL',
        label: 'SL Drop Jump (Reattività Monopodalica SX/DX)',
        isPopulated: hasVal(sess.slDjCtSX, sess.slDjCtDX, sess.slDjRsiSX, sess.slDjRsiDX, sess.slDjHeightSX, sess.slDjHeightDX, sess.slDjBrakingSX, sess.slDjBrakingDX)
      },
      {
        id: 'CLINICAL_SCORES',
        label: 'Hop Test & Score Clinici (IKDC, ACL-RSI, Single/Triple Hop)',
        isPopulated: hasVal(sess.ikdc, sess.ikdc_score, sess.aclrsi, sess.lsiSingleHop, sess.lsiTripleHop)
      }
    ];
    return modules.filter((m) => m.isPopulated);
  };

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

    let standardRows = [];

    switch (activeSubTab) {
      case 'LSI':
        standardRows = [
          {
            key: 'lsiQuad',
            deltaKey: 'lsiQuadDelta',
            label: 'LSI Quadricipite Iso Push',
            unit: '%',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => extractMetricFromSingleTest(t, ['lsiQuad', 'lsi_quad_calculated'], false, operatedLimb),
            getValue: (t) =>
              fmtSingle(extractMetricFromSingleTest(t, ['lsiQuad', 'lsi_quad_calculated'], false, operatedLimb), '%')
          },
          {
            key: 'lsiFlex',
            deltaKey: 'lsiFlexDelta',
            label: 'LSI Ischiocrurali Leg Curl',
            unit: '%',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => extractMetricFromSingleTest(t, ['lsiFlex', 'lsi_curl_calculated'], false, operatedLimb),
            getValue: (t) =>
              fmtSingle(extractMetricFromSingleTest(t, ['lsiFlex', 'lsi_curl_calculated'], false, operatedLimb), '%')
          },
          ...(selectedPhase === 'Fase 1' || selectedPhase === 'Fase 2 (>70%)'
            ? []
            : [
                {
                  key: 'lsiSingleHop',
                  label: 'LSI Single Hop Test',
                  unit: '%',
                  dotColor: 'bg-emerald-600',
                  getRawValue: (t) => toStrictNullOrNumber(t?.lsiSingleHop ?? t?.lsi_single_hop),
                  getValue: (t) => fmtSingle(t?.lsiSingleHop ?? t?.lsi_single_hop, '%')
                },
                {
                  key: 'lsiTripleHop',
                  label: 'LSI Triple Hop Test',
                  unit: '%',
                  dotColor: 'bg-emerald-600',
                  getRawValue: (t) => toStrictNullOrNumber(t?.lsiTripleHop ?? t?.lsi_triple_hop),
                  getValue: (t) => fmtSingle(t?.lsiTripleHop ?? t?.lsi_triple_hop, '%')
                }
              ]),
          {
            key: 'ikdc',
            label: 'Score IKDC Soggettivo',
            unit: '/100',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.ikdc ?? t?.ikdc_score),
            getValue: (t) => fmtSingle(t?.ikdc ?? t?.ikdc_score, 'pts')
          },
          {
            key: 'aclrsi',
            label: 'Score ACL-RSI Psicometrico',
            unit: '/100',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.aclrsi ?? t?.acl_rsi),
            getValue: (t) => fmtSingle(t?.aclrsi ?? t?.acl_rsi, 'pts')
          }
        ];
        break;

      case 'FORZA':
        standardRows = [
          {
            key: 'quadSano',
            label: 'Iso Push Leg Ext (SX)',
            unit: 'N',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.quadSano ?? t?.iso_leg_ext_sx),
            getValue: (t) => fmtSingle(t?.quadSano ?? t?.iso_leg_ext_sx, 'N')
          },
          {
            key: 'quadOp',
            label: 'Iso Push Leg Ext (DX)',
            unit: 'N',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.quadOp ?? t?.iso_leg_ext_dx),
            getValue: (t) => fmtSingle(t?.quadOp ?? t?.iso_leg_ext_dx, 'N')
          },
          {
            key: 'flexSano',
            label: 'Iso Push Leg Curl (SX)',
            unit: 'N',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.flexSano ?? t?.iso_leg_curl_sx),
            getValue: (t) => fmtSingle(t?.flexSano ?? t?.iso_leg_curl_sx, 'N')
          },
          {
            key: 'flexOp',
            label: 'Iso Push Leg Curl (DX)',
            unit: 'N',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.flexOp ?? t?.iso_leg_curl_dx),
            getValue: (t) => fmtSingle(t?.flexOp ?? t?.iso_leg_curl_dx, 'N')
          },
          {
            key: 'bulgarianSX',
            label: 'Bulgarian 6RM (SX)',
            unit: 'kg',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.bulgarianSX ?? t?.bulgarian_sx),
            getValue: (t) => fmtSingle(t?.bulgarianSX ?? t?.bulgarian_sx, 'kg')
          },
          {
            key: 'bulgarianDX',
            label: 'Bulgarian 6RM (DX)',
            unit: 'kg',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.bulgarianDX ?? t?.bulgarian_dx),
            getValue: (t) => fmtSingle(t?.bulgarianDX ?? t?.bulgarian_dx, 'kg')
          },
          {
            key: 'soleoSX',
            label: 'Soleo Seduto (SX)',
            unit: 'kg',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.soleoSX ?? t?.soleo_sx),
            getValue: (t) => fmtSingle(t?.soleoSX ?? t?.soleo_sx, 'kg')
          },
          {
            key: 'soleoDX',
            label: 'Soleo Seduto (DX)',
            unit: 'kg',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.soleoDX ?? t?.soleo_dx),
            getValue: (t) => fmtSingle(t?.soleoDX ?? t?.soleo_dx, 'kg')
          },
          {
            key: 'imtpForce',
            label: 'IMTP Peak Force',
            unit: 'N',
            dotColor: 'bg-amber-500',
            getRawValue: (t) => toStrictNullOrNumber(t?.imtpForce ?? t?.imtp_peak_force),
            getValue: (t) => fmtSingle(t?.imtpForce ?? t?.imtp_peak_force, 'N')
          }
        ];
        break;

      case 'CMJ_BILATERAL':
        standardRows = [
          {
            key: 'jumpHeight',
            label: 'Altezza Salto',
            unit: 'cm',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto),
            getValue: (t) => fmtSingle(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto, 'cm')
          },
          {
            key: 'rsiCmj',
            label: 'RSImod',
            unit: 'm/s',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => extractMetricFromSingleTest(t, ['rsiCmj', 'rsi_cmj', 'rsi_mod'], false, operatedLimb),
            getValue: (t) => {
              const v = extractMetricFromSingleTest(t, ['rsiCmj', 'rsi_cmj', 'rsi_mod'], false, operatedLimb);
              return v !== null ? `${v} m/s` : 'Non testato';
            }
          },
          {
            key: 'peakPower',
            label: 'Peak Power / BM',
            unit: 'W/kg',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco),
            getValue: (t) => fmtSingle(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco, 'W/kg')
          },
          {
            key: 'cmjDepth',
            label: 'Countermovement Depth',
            unit: 'cm',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.cmjDepth ?? t?.cmj_depth),
            getValue: (t) => fmtSingle(t?.cmjDepth ?? t?.cmj_depth, 'cm')
          },
          {
            key: 'contractionTime',
            label: 'Contraction Time',
            unit: 'ms',
            dotColor: 'bg-amber-500',
            getRawValue: (t) => toStrictNullOrNumber(t?.contractionTime ?? t?.contraction_time_ms),
            getValue: (t) => fmtSingle(t?.contractionTime ?? t?.contraction_time_ms, 'ms')
          },
          {
            key: 'eccBrakingRfd',
            label: 'Eccentric Braking RFD',
            unit: 'N/s',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.eccBrakingRfd ?? t?.ecc_braking_rfd),
            getValue: (t) => fmtSingle(t?.eccBrakingRfd ?? t?.ecc_braking_rfd, 'N/s')
          },
          {
            key: 'concImpulseSplit',
            label: 'Concentric Impulse (SX / DX)',
            unit: 'N·s',
            dotColor: 'bg-emerald-600',
            getValue: (t) => fmtPair(t?.concImpulseSX ?? t?.conc_impulse_sx, t?.concImpulseDX ?? t?.conc_impulse_dx),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.concImpulseSX ?? t?.conc_impulse_sx);
              const dx = toStrictNullOrNumber(t?.concImpulseDX ?? t?.conc_impulse_dx);
              const lsi = calcRatioLsi(sx, dx, operatedLimb);
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
        break;

      case 'CMJ_SL':
        standardRows = [
          {
            key: 'slCmjHeightSplit',
            label: 'Altezza Salto (SX / DX)',
            unit: 'cm',
            dotColor: 'bg-emerald-600',
            getValue: (t) => fmtPair(t?.slCmjHeightSX, t?.slCmjHeightDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjHeightSX);
              const dx = toStrictNullOrNumber(t?.slCmjHeightDX);
              const lsi = calcRatioLsi(sx, dx, operatedLimb);
              return sx !== null && dx !== null
                ? { title: 'Altezza Salto SL (SX vs DX)', sx: `${sx} cm`, dx: `${dx} cm`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          },
          {
            key: 'slCmjPeakPowerSplit',
            label: 'Peak Power / BM (SX / DX)',
            unit: 'W/kg',
            dotColor: 'bg-teal-600',
            getValue: (t) => fmtPair(t?.slCmjPeakPowerSX, t?.slCmjPeakPowerDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjPeakPowerSX);
              const dx = toStrictNullOrNumber(t?.slCmjPeakPowerDX);
              const lsi = calcRatioLsi(sx, dx, operatedLimb);
              return sx !== null && dx !== null
                ? { title: 'Peak Power / BM SL (SX vs DX)', sx: `${sx} W/kg`, dx: `${dx} W/kg`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          },
          {
            key: 'slCmjRsiSplit',
            label: 'RSImod (SX / DX)',
            unit: 'm/s',
            dotColor: 'bg-emerald-600',
            getValue: (t) => fmtPair(t?.slCmjRsiSX, t?.slCmjRsiDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjRsiSX);
              const dx = toStrictNullOrNumber(t?.slCmjRsiDX);
              const lsi = calcRatioLsi(sx, dx, operatedLimb);
              return sx !== null && dx !== null
                ? { title: 'RSImod Monopodalico (SX vs DX)', sx: `${sx} m/s`, dx: `${dx} m/s`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          },
          {
            key: 'slCmjDepthSplit',
            label: 'Countermovement Depth (SX / DX)',
            unit: 'cm',
            dotColor: 'bg-teal-600',
            getValue: (t) => fmtPair(t?.slCmjDepthSX, t?.slCmjDepthDX),
            getTooltip: (t) => {
              const sx = toStrictNullOrNumber(t?.slCmjDepthSX);
              const dx = toStrictNullOrNumber(t?.slCmjDepthDX);
              const lsi = calcRatioLsi(sx, dx, operatedLimb);
              return sx !== null && dx !== null
                ? { title: 'Countermovement Depth SL (SX vs DX)', sx: `${sx} cm`, dx: `${dx} cm`, asym: lsi ? `LSI: ${lsi}%` : 'LSI: N/A' }
                : null;
            }
          }
        ];
        break;

      case 'DJ_BILATERAL':
        standardRows = [
          {
            key: 'djBoxHeight',
            label: 'Altezza Caduta Box',
            unit: '-',
            dotColor: 'bg-amber-500',
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
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.djJumpHeight),
            getValue: (t) => fmtSingle(t?.djJumpHeight, 'cm')
          },
          {
            key: 'djContactTime',
            label: 'Ground Contact Time GCT (<250ms)',
            unit: 'ms',
            dotColor: 'bg-amber-500',
            getRawValue: (t) => toStrictNullOrNumber(t?.djContactTime),
            getValue: (t) => fmtSingle(t?.djContactTime, 'ms')
          },
          {
            key: 'rsiDropJump',
            label: '1. Efficienza Pliometrica RSI (>2.0)',
            unit: 'idx',
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => extractMetricFromSingleTest(t, ['rsiDropJump', 'djRSI', 'dj_rsi'], false, operatedLimb),
            getValue: (t) =>
              fmtSingle(extractMetricFromSingleTest(t, ['rsiDropJump', 'djRSI', 'dj_rsi'], false, operatedLimb), 'idx')
          },
          {
            key: 'djTtpfMs',
            label: '2. Time to Peak Force TTPF (80-120ms)',
            unit: 'ms',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => toStrictNullOrNumber(t?.djTtpfMs),
            getValue: (t) => fmtSingle(t?.djTtpfMs, 'ms')
          },
          {
            key: 'djTakeoffAsymMs',
            label: '3. Asimmetria Temporale Stacco (<10ms)',
            unit: 'ms',
            dotColor: 'bg-emerald-600',
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
            dotColor: 'bg-emerald-600',
            getRawValue: (t) => {
              const calc = calcRatioLsi(t?.djLandingPeakSX, t?.djLandingPeakDX, operatedLimb);
              if (calc !== null) return parseFloat(calc);
              return toStrictNullOrNumber(t?.djLandingPeakLsi);
            },
            getValue: (t) => {
              const calc = calcRatioLsi(t?.djLandingPeakSX, t?.djLandingPeakDX, operatedLimb);
              if (calc !== null) return `${calc}%`;
              const direct = toStrictNullOrNumber(t?.djLandingPeakLsi);
              return direct !== null ? `${direct}%` : 'Non testato';
            }
          },
          {
            key: 'djConcImpulseLsi',
            label: 'Concentric Impulse LSI (>=95%)',
            unit: '%',
            dotColor: 'bg-teal-600',
            getRawValue: (t) => {
              const calc = calcRatioLsi(t?.djConcImpulseSX, t?.djConcImpulseDX, operatedLimb);
              if (calc !== null) return parseFloat(calc);
              return toStrictNullOrNumber(t?.djConcImpulseLsi);
            },
            getValue: (t) => {
              const calc = calcRatioLsi(t?.djConcImpulseSX, t?.djConcImpulseDX, operatedLimb);
              if (calc !== null) return `${calc}%`;
              const direct = toStrictNullOrNumber(t?.djConcImpulseLsi);
              return direct !== null ? `${direct}%` : 'Non testato';
            }
          }
        ];
        break;

      case 'DJ_SL':
        standardRows = [
          {
            key: 'slDjBoxHeight',
            label: 'Altezza Caduta Box',
            unit: 'cm',
            dotColor: 'bg-amber-500',
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
            dotColor: 'bg-amber-500',
            getValue: (t) => fmtPair(t?.slDjCtSX, t?.slDjCtDX)
          },
          {
            key: 'slDjRsiSplit',
            label: 'RSI (SX / DX)',
            unit: 'm/s',
            dotColor: 'bg-emerald-600',
            getValue: (t) => fmtPair(t?.slDjRsiSX, t?.slDjRsiDX)
          },
          {
            key: 'slDjHeightSplit',
            label: 'Altezza Salto (SX / DX)',
            unit: 'cm',
            dotColor: 'bg-teal-600',
            getValue: (t) => fmtPair(t?.slDjHeightSX, t?.slDjHeightDX)
          },
          {
            key: 'slDjBrakingSplit',
            label: 'Braking Impulse (SX / DX)',
            unit: 'N·s',
            dotColor: 'bg-emerald-600',
            getValue: (t) => fmtPair(t?.slDjBrakingSX, t?.slDjBrakingDX)
          }
        ];
        break;

      default:
        standardRows = [];
    }

    // Estrae tutte le metriche personalizzate (non nascoste) associate al dominio corrente
    const relevantTestTypes = getCustomTestTypesForSubTab(activeSubTab);
    const customMetricsMap = new Map();
    const hiddenMetricsSet = new Set();

    displayedSessions.forEach(sess => {
      const cmObj = sess?.custom_metrics;
      if (!cmObj || typeof cmObj !== 'object') return;
      relevantTestTypes.forEach(tType => {
        const list = cmObj[tType];
        if (!Array.isArray(list)) return;
        list.forEach(m => {
          if (!m?.metric_name) return;
          const compositeKey = `${tType}::${m.metric_name.trim().toLowerCase()}`;
          if (m.is_hidden) {
            hiddenMetricsSet.add(compositeKey);
            customMetricsMap.delete(compositeKey);
          } else if (!hiddenMetricsSet.has(compositeKey)) {
            customMetricsMap.set(compositeKey, {
              testType: tType,
              metricName: m.metric_name.trim(),
              unit: m.unit || customMetricsMap.get(compositeKey)?.unit || ''
            });
          }
        });
      });
    });

    const dynamicCustomRows = Array.from(customMetricsMap.values()).map(cmDef => ({
      key: `custom_${cmDef.testType}_${cmDef.metricName}`,
      label: cmDef.metricName,
      unit: cmDef.unit || '',
      isCustomMetric: true,
      customTestType: cmDef.testType,
      customMetricName: cmDef.metricName,
      dotColor: 'bg-emerald-500',
      getRawValue: (t) => {
        const arr = t?.custom_metrics?.[cmDef.testType];
        if (!Array.isArray(arr)) return null;
        const found = arr.find(
          item => !item.is_hidden && item.metric_name?.trim().toLowerCase() === cmDef.metricName.toLowerCase()
        );
        return found ? toStrictNullOrNumber(found.metric_value, true) : null;
      },
      getValue: (t) => {
        const arr = t?.custom_metrics?.[cmDef.testType];
        if (!Array.isArray(arr)) return 'Non testato';
        const found = arr.find(
          item => !item.is_hidden && item.metric_name?.trim().toLowerCase() === cmDef.metricName.toLowerCase()
        );
        const val = found ? toStrictNullOrNumber(found.metric_value, true) : null;
        if (val === null) return 'Non testato';
        return `${val}${cmDef.unit ? ` ${cmDef.unit}` : ''}`;
      }
    }));

    return [...standardRows, ...dynamicCustomRows];
  };

  const rows = getSubTabRows();

  const getDeltaText = (row, currTest, tIdx) => {
    const currVal = row.getRawValue ? row.getRawValue(currTest) : toStrictNullOrNumber(currTest?.[row.key]);
    if (currVal === null || tIdx === 0) return null;

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

  const currentChecklistState = checklistStateByPhase[phaseKey] || {};
  const toggleChecklistItem = (itemId) => {
    setChecklistStateByPhase((prev) => ({
      ...prev,
      [phaseKey]: {
        ...(prev[phaseKey] || {}),
        [itemId]: !prev[phaseKey]?.[itemId]
      }
    }));
  };

  const allSubTabs = [
    { id: 'LSI', label: '⚡ Simmetrie & LSI (%)' },
    { id: 'FORZA', label: '🔥 Dominio della Forza' },
    { id: 'CMJ_BILATERAL', label: '📈 CMJ Bilaterale' },
    { id: 'CMJ_SL', label: '🦶 CMJ Monopodalico' },
    { id: 'DJ_BILATERAL', label: '📦 Drop Jump Bilaterale' },
    { id: 'DJ_SL', label: '⚡ SL Drop Jump' }
  ];
  const visibleSubTabs = allSubTabs.filter(tab => !allowedSubTabs || allowedSubTabs.includes(tab.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none w-full items-start">

      {/* ========================================================================= */}
      {/* COLONNA SINISTRA (2/3): TABELLA LONGITUDINALE + GRAFICO MULTIMETRICA      */}
      {/* ========================================================================= */}
      <div className="lg:col-span-2 flex flex-col gap-6 w-full min-w-0">
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-300/60 space-y-4 shadow-none w-full flex flex-col justify-between break-inside-avoid">

          {/* Header Tabella + Pulsanti Inserimento Modulare e Raggruppamento Report */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3.5 border-b border-slate-300/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1 bg-rose-100/80 text-rose-900 border border-rose-300/50 rounded shrink-0">
                <Flame className="w-4 h-4 text-rose-900" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base tracking-wide">
                  Test e valutazione
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto print:hidden">

              {activeTest && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTest(activeTest);
                      setInitialModalModule(getDefaultModuleForSubTab(activeSubTab));
                      setIsModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-purple-100/80 hover:bg-purple-200/70 text-purple-900 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-purple-300/50 transition-all cursor-pointer shrink-0 shadow-none"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-900" />
                    <span>Modifica / + Metrica in {activeTest.session_name || activeTest.label}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionToDelete(activeTest)}
                    title={`Elimina un singolo test o l'intera sessione ${activeTest.session_name || activeTest.label}`}
                    className="px-3 py-2 bg-rose-100/80 hover:bg-rose-200/70 text-rose-900 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-rose-300/50 transition-all cursor-pointer shrink-0 shadow-none"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-900" />
                    <span>Elimina Test / Sessione</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditingTest(null);
                  setInitialModalModule(getDefaultModuleForSubTab(activeSubTab));
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-sky-100/80 hover:bg-sky-200/70 text-sky-900 border border-sky-300/50 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-none transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-sky-900" />
                <span>+ Rileva Singolo Test</span>
              </button>
            </div>
          </div>

          {/* Sotto-Tab per Dominio filtrate per Fase */}
          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none p-1.5 bg-slate-200/50 rounded-xl border border-slate-300/60 print:hidden">
            {visibleSubTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300/50 font-bold shadow-none'
                      : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TABELLA STORICO LONGITUDINALE MULTI-SESSIONE */}
          <div className="overflow-x-auto overflow-y-auto max-h-[520px] rounded-xl border border-slate-300/60 bg-slate-50 w-full scrollbar-thin">
            <table className="w-full min-w-max text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300/60 text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider bg-slate-100">
                  <th className="sticky top-0 left-0 z-40 bg-slate-100 border-b border-r border-slate-300/60 py-3.5 px-4 text-slate-800 font-bold min-w-[240px] w-[250px]">
                    Parametro Metrica
                  </th>

                  {displayedSessions.map((t) => {
                    const isSelected = t.id === selectedTestId;
                    return (
                      <th
                        key={t.id}
                        onClick={() => setSelectedTestId(t.id)}
                        className={`sticky top-0 z-30 py-3 px-3.5 text-center cursor-pointer transition-all border-b border-r border-slate-300/60 min-w-[135px] ${
                          isSelected
                            ? 'bg-emerald-100/80 text-emerald-900 font-bold border-t-2 border-t-emerald-600'
                            : 'bg-slate-100 hover:bg-slate-200/50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-xs tracking-tight text-slate-800">
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
                            className="p-1 hover:bg-slate-200/70 rounded transition-colors text-slate-600 hover:text-slate-900 print:hidden"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTestId(t.id);
                              setSessionToDelete(t);
                            }}
                            title={`Elimina un test o l'intera sessione ${t.session_name || t.label}`}
                            className="p-1 hover:bg-rose-100 rounded transition-colors text-slate-500 hover:text-rose-800 print:hidden"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono font-semibold mt-0.5">
                          {t.dateRange || t.date}
                        </div>
                        {t.aggregatedCount > 1 && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100/80 border border-sky-300/50 text-[9px] text-sky-900 font-sans font-bold">
                            <Layers className="w-2.5 h-2.5" />
                            <span>{t.aggregatedCount} rilevazioni</span>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300/60 text-xs">
                {displayedSessions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-slate-600 font-semibold bg-slate-50">
                      <div className="space-y-2.5 max-w-sm mx-auto">
                        <div className="w-8 h-8 rounded-lg bg-sky-100/80 text-sky-900 border border-sky-300/50 flex items-center justify-center mx-auto">
                          <Activity className="w-4 h-4 text-sky-900" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          Nessun test registrato per {patient?.nome} {patient?.cognome}
                        </p>
                        <p className="text-xs text-slate-600">
                          Clicca su <strong className="text-slate-800 font-bold">&quot;+ Rileva Singolo Test&quot;</strong> per scegliere quale test clinico inserire.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rowIdx) => (
                    <tr
                      key={row.key}
                      className={`transition-colors border-b border-slate-300/60 ${
                        rowIdx % 2 === 0 ? 'bg-slate-50' : 'bg-slate-100/80'
                      } hover:bg-slate-200/50`}
                    >
                      {/* Colonna 1: Parametro Metrica */}
                      <td
                        className={`sticky left-0 z-20 border-r border-slate-300/60 py-3.5 px-4 min-w-[240px] w-[250px] ${
                          rowIdx % 2 === 0 ? 'bg-slate-50' : 'bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${row.dotColor || 'bg-emerald-600'} shrink-0`} />
                            <div className="min-w-0">
                              <span className="text-[13px] font-bold text-slate-800 leading-snug">
                                {row.label}
                                {row.unit && row.unit !== '-' && (
                                  <span className="ml-1.5 text-slate-500 font-normal text-[11px] font-mono">
                                    ({row.unit})
                                  </span>
                                )}
                              </span>
                              {row.isCustomMetric && (
                                <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-100/80 border border-purple-300/50 text-purple-900 text-[9px] font-bold uppercase">
                                  <Sliders className="w-2.5 h-2.5" />
                                  Custom
                                </span>
                              )}
                            </div>
                          </div>

                          {row.isCustomMetric && (
                            <button
                              type="button"
                              onClick={() => handleHideCustomMetricFromTable(row.customTestType, row.customMetricName)}
                              title="Nascondi / Elimina questa metrica personalizzata dalla tabella"
                              className="p-1 rounded text-slate-400 hover:text-rose-900 hover:bg-rose-100/80 transition-colors shrink-0 cursor-pointer print:hidden"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
                            className={`relative group py-3 px-3 text-center font-mono cursor-pointer transition-all border-r border-slate-300/60 min-w-[135px] ${
                              isSelected
                                ? 'bg-emerald-100/30 font-bold'
                                : 'hover:bg-slate-200/50'
                            }`}
                          >
                            {isUntested ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-200/70 text-slate-600 text-[11px] font-sans font-semibold">
                                Non testato
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5 flex-wrap relative">
                                <span className="font-bold text-[13px] text-slate-800 tabular-nums">
                                  {displayVal}
                                </span>
                                {delta && (
                                  <span
                                    className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${
                                      delta.startsWith('+')
                                        ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300/50'
                                        : 'bg-rose-100/80 text-rose-900 border-rose-300/50'
                                    }`}
                                  >
                                    {delta}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSingleCellMetric(t, row);
                                  }}
                                  title={`Elimina ${row.label} da ${t.session_name || t.label}`}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-800 transition-all cursor-pointer print:hidden"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* HOVER TOOLTIP INTERATTIVO */}
                            {tooltipData && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-64 p-3.5 rounded-xl bg-slate-50 border border-slate-300/60 shadow-none text-xs font-sans pointer-events-none text-left">
                                <div className="font-bold text-slate-800 text-xs border-b border-slate-300/60 pb-1.5 mb-2 flex items-center justify-between">
                                  <span>{tooltipData.title}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 py-0.5">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-700" />
                                    Gamba SX:
                                  </span>
                                  <strong className="text-slate-800 font-mono">{tooltipData.sx}</strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 py-0.5">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-sky-700" />
                                    Gamba DX:
                                  </span>
                                  <strong className="text-slate-800 font-mono">{tooltipData.dx}</strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-800 border-t border-slate-300/60 pt-1.5 mt-1.5 font-bold">
                                  <span>Simmetria:</span>
                                  <strong className="text-emerald-900 font-mono">{tooltipData.asym}</strong>
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

        {/* GRAFICO MULTIMETRICA ALLINEATO ALLA TABELLA (2/3 LARGHEZZA, SOTTO LA TABELLA) */}
        <div className="w-full break-inside-avoid">
          <UIErrorBoundary title="Grafico Multimetrico Temporaneamente Non Disponibile">
            <GraficoMultimetrica
              key={`multimetric-${displayedSessions.length}-${testsHistorySignature.length}-${activeSubTab}`}
              tests={displayedSessions}
              activeSubTab={activeSubTab}
              operatedLimb={operatedLimb}
            />
          </UIErrorBoundary>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLONNA DESTRA (1/3): BARRE TARGET PRESTATIVI & CHECKLIST QUALITATIVA     */}
      {/* ========================================================================= */}
      <div className="lg:col-span-1 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-300/60 space-y-4 shadow-none w-full flex flex-col justify-between break-inside-avoid">

        {/* Header Barre Target */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 rounded shrink-0">
              <Trophy className="w-4 h-4 text-emerald-900" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                BARRE TARGET &amp; PROGRESSO
              </h3>
              <p className="text-[11px] text-slate-600 font-semibold">
                Ultimo dato valido rilevato (ignora test non eseguiti)
              </p>
            </div>
          </div>
        </div>

        {/* Selezione Fase Target (Pillole F1, F2, F3, F4, F5) */}
        <div className="space-y-2 bg-slate-100/80 p-3 rounded-xl border border-slate-300/60 print:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 uppercase tracking-wider text-[10px] font-bold">TARGET FASE:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 font-bold text-xs">{selectedPhase}</span>
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
                  onClick={() => handleSelectPhaseClick(pObj.key)}
                  className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center border ${
                    isActive
                      ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300/50 shadow-none'
                      : 'bg-slate-50 text-slate-700 border-slate-300/60 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {pObj.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BARRE DI PROGRESSO: TITOLO INTERO LEGGIBILE, NESSUNA DATA, TESTO SOPRA LA BARRA */}
        <div className="space-y-3">
          {cupsData.map((cup) => {
            if (cup.earlyNote) {
              return (
                <div key={cup.id} className="p-4 rounded-xl bg-emerald-100/80 border border-emerald-300/50 text-slate-800 text-xs space-y-1.5 break-inside-avoid">
                  <div className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-900 shrink-0" />
                    <span className="whitespace-normal break-words">{cup.title} — {cup.subtitle}</span>
                  </div>
                  <p className="text-xs text-emerald-900 font-semibold leading-relaxed">{cup.earlyNote}</p>
                </div>
              );
            }

            const isEvaluated = cup.value !== null && cup.value !== undefined;
            const fillPct = isEvaluated ? Math.min(100, Math.max(8, cup.percentageAchieved)) : 0;
            const isTargetOk = cup.isOk;
            const cleanTargetText = cup.targetLabel ? cup.targetLabel.replace('Target:', 'Target') : '';
            const barColorClass = cup.barColor || (!isEvaluated ? 'bg-slate-300' : isTargetOk ? 'bg-emerald-500' : 'bg-amber-500');
            const badgeText = cup.badgeText || (!isEvaluated ? 'NON TESTATO' : isTargetOk ? 'TARGET OK' : 'IN CORSO');
            const badgeClass =
              cup.badgeClass ||
              (!isEvaluated
                ? 'bg-slate-200/70 border-slate-300 text-slate-600'
                : isTargetOk
                ? 'bg-emerald-100/80 border-emerald-300/50 text-emerald-900'
                : 'bg-amber-100/80 border-amber-300/50 text-amber-900');
            const pctBadgeClass =
              cup.pctBadgeClass || (isTargetOk ? 'bg-emerald-100/80 text-emerald-900' : 'bg-sky-100/80 text-sky-900');

            return (
              <div
                key={cup.id}
                className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-300/60 space-y-2.5 hover:bg-slate-200/50 transition-all break-inside-avoid"
              >
                {/* Riga 1: Titolo Metrica COMPLETO E LEGGIBILE + Badge Stato */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13px] font-bold text-slate-800 tracking-wide leading-snug whitespace-normal break-words flex-1">
                    {cup.title}
                  </span>

                  <div className="shrink-0 pt-0.5">
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase flex items-center gap-1 ${badgeClass}`}>
                      {isEvaluated && isTargetOk && <CheckCircle2 className="w-3 h-3 text-emerald-900 shrink-0" />}
                      {badgeText}
                    </span>
                  </div>
                </div>

                {/* Riga 2 (SOPRA LA BARRA): Valore Numerico / Target + % Raggiungimento */}
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono tabular-nums">
                    {isEvaluated ? (
                      <>
                        <span className="text-base font-bold text-slate-800">
                          {cup.displayVal}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 ml-1.5">
                          / {cleanTargetText}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">
                        Non testato (N/A) — {cleanTargetText}
                      </span>
                    )}
                  </div>

                  {isEvaluated && (
                    <span
                      className={`text-xs font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${pctBadgeClass}`}
                    >
                      {cup.percentageAchieved}%
                    </span>
                  )}
                </div>

                {/* Riga 3: Barra di Progresso pura con codifica colore dinamica */}
                <div className="w-full h-3.5 bg-slate-200/80 rounded-full border border-slate-300/80 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColorClass}`}
                    style={{ width: `${isEvaluated ? fillPct : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* CHECKLIST QUALITATIVA */}
        <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-300/60 space-y-2.5 mt-1 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-purple-100/80 text-purple-900 border border-purple-300/50 rounded">
                <CheckSquare className="w-4 h-4 text-purple-900" />
              </div>
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Checklist Qualitativa ({selectedPhase})
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-900 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-300/50">
              {currentChecklistItems.filter(item => Boolean(currentChecklistState[item.id])).length}/{currentChecklistItems.length} OK
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {currentChecklistItems.map((item) => {
              const isChecked = Boolean(currentChecklistState[item.id]);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`p-2.5 px-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-100/80 border-emerald-300/60 text-emerald-900 font-bold shadow-none'
                      : 'bg-slate-50 border-slate-300/60 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold whitespace-normal leading-snug">
                    {item.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-between justify-center shrink-0 ml-2 transition-colors ${
                      isChecked ? 'bg-emerald-700 border-emerald-700 text-slate-50' : 'border-slate-400 bg-slate-50'
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

      {/* MODAL ELIMINAZIONE SELETTIVA SINGOLO TEST O INTERA SESSIONE */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs print:hidden">
          <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Elimina Test o Sessione
                  </h3>
                  <p className="text-xs text-slate-600 font-semibold">
                    Sessione: <strong className="text-slate-900">{sessionToDelete.session_name || sessionToDelete.label}</strong> ({sessionToDelete.dateRange || sessionToDelete.date})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opzione 1: Eliminazione selettiva di singoli moduli/test presenti nella sessione */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Elimina un singolo Test dentro questa sessione:
              </span>
              {(() => {
                const populatedModules = getPopulatedModulesForSession(sessionToDelete);
                if (populatedModules.length === 0) {
                  return (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-semibold">
                      Tutti i singoli test di questa sessione sono già stati svuotati. Puoi procedere a eliminare l&apos;intera colonna sessione qui sotto.
                    </div>
                  );
                }
                return (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {populatedModules.map((mod) => (
                      <div
                        key={mod.id}
                        className="p-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <span className="text-xs font-bold text-slate-800 leading-snug">
                          {mod.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTestModuleFromSession(sessionToDelete, mod.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Rimuovi Test</span>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Opzione 2: Eliminazione completa dell'intera sessione */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <span className="block text-xs font-bold text-rose-800 uppercase tracking-wider">
                2. Sei sicuro di voler eliminare questa intera sessione di valutazione?
              </span>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSessionToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Chiudi
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEntireSession(sessionToDelete)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina Intera Sessione ({sessionToDelete.session_name || sessionToDelete.label})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
